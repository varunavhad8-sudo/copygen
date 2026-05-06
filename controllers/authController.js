const User = require('../models/User');
const admin = require('../config/firebase');
const { isWorkEmail } = require('../utils/authValidation');
const { getDbStatus } = require('../config/db');

const TRIAL_DAYS = 7;

const register = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not ready' });
    const decoded = await admin.auth().verifyIdToken(token);
    
    const isGoogle = decoded.firebase?.sign_in_provider === 'google.com';
    console.log('[Auth] Register attempt:', { email: decoded.email, provider: decoded.firebase?.sign_in_provider, isGoogle });

    // Temporarily disabled for troubleshooting
    /*
    if (!isGoogle && !isWorkEmail(decoded.email)) {
      console.warn('[Auth] Rejected non-work email:', decoded.email);
      return res.status(403).json({ 
        success: false, 
        message: 'Registration restricted to work emails only.' 
      });
    }
    */

    let user = await User.findOne({ firebaseUid: decoded.uid });
    
    // If UID not found, check by email to handle account linking/re-registration
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase().trim() });
      if (user) {
        console.log('[Auth] Found user by email, linking new Firebase UID:', { email: user.email, newUid: decoded.uid });
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }
    
    if (!user) {
      console.log('[Auth] Creating new user record for:', decoded.email);
      try {
        user = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email.toLowerCase().trim(),
          name: decoded.name || '',
          workspace: decoded.name || '',
          plan: 'free',
          isTrial: true,
          trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
          generationsLimit: 10,
          generationsUsed: 0,
          brandVoicesUsed: 0,
          brandVoicesLimit: 1,
          planLimits: { maxGenerations: 10, maxBrandVoices: 1 }
        });
        
        // Send Welcome Email (Non-blocking)
        const { sendWelcomeEmail } = require('../services/email.service');
        sendWelcomeEmail(user.email, user.name || 'there');
      } catch (createErr) {
        console.error('[Auth] User creation failed:', createErr.message);
        return res.status(500).json({ success: false, message: 'Failed to create user profile.' });
      }
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const patchProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'workspace', 'timezone'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;

    // 1. Delete from Firebase Auth
    if (user.firebaseUid) {
      await admin.auth().deleteUser(user.firebaseUid).catch(err => {
        console.error('Failed to delete Firebase user:', err.message);
      });
    }

    // 2. Delete user's content models
    const BrandProfile = require('../models/BrandProfile');
    const Output = require('../models/Output');
    const Brief = require('../models/Brief');
    const Client = require('../models/Client');
    const Template = require('../models/Template');
    
    await BrandProfile.deleteMany({ userId: user._id });
    await Output.deleteMany({ userId: user._id });
    await Brief.deleteMany({ userId: user._id });
    await Client.deleteMany({ userId: user._id });
    await Template.deleteMany({ userId: user._id });

    // 3. Cancel any active subscriptions
    if (user.planType === 'razorpay' && user.razorpaySubscriptionId) {
      const { cancelRazorpaySubscription } = require('../services/razorpay.service');
      await cancelRazorpaySubscription(user._id).catch(err => console.error('Failed to cancel Razorpay:', err.message));
    } else if (user.planType === 'dodo' && user.dodoSubscriptionId) {
      const { cancelDodoSubscription } = require('../services/dodo.service');
      await cancelDodoSubscription(user._id).catch(err => console.error('Failed to cancel Dodo:', err.message));
    }

    // 4. Mark user document for 30-day purge
    user.scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    // Erase identifying information to comply with GDPR immediately
    user.email = `deleted_${Date.now()}@copygen.in`;
    user.name = 'Deleted User';
    user.workspace = 'Deleted Workspace';
    user.firebaseUid = `deleted_${Date.now()}`;
    await user.save();

    res.json({ success: true, message: 'Account and associated data deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { onboardingCompleted: true },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

const getOnboardingStatus = async (req, res, next) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not ready' });
    const userId = req.user._id;
    const Client = require('../models/Client');
    const BrandProfile = require('../models/BrandProfile');
    
    const clientCount = await Client.countDocuments({ userId });
    const brandCount = await BrandProfile.countDocuments({ userId });
    const hasGenerated = req.user.generationsUsed > 0;

    res.json({
      success: true,
      hasClients: clientCount > 0,
      hasBrand: brandCount > 0,
      hasGenerated,
      isComplete: req.user.onboardingCompleted
    });
  } catch(error) { next(error); }
};

module.exports = { register, getMe, patchProfile, deleteAccount, completeOnboarding, getOnboardingStatus };



