const User = require('../models/User');
const admin = require('../config/firebase');
const { isWorkEmail } = require('../utils/authValidation');
const { getDbStatus } = require('../config/db');
const crypto = require('crypto');

const { PLAN_LIMITS } = require('../config/plans');

const TRIAL_DAYS = 7;

const register = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not ready' });
    const decoded = await admin.auth().verifyIdToken(token);
    
    const isGoogle = decoded.firebase?.sign_in_provider === 'google.com';
    console.log('[Auth] Register attempt:', { email: decoded.email, provider: decoded.firebase?.sign_in_provider, isGoogle });

    let user = await User.findOne({ firebaseUid: decoded.uid });
    
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
          generationsLimit: PLAN_LIMITS.free.generations,
          generationsUsed: 0,
          brandVoicesUsed: 0,
          brandVoicesLimit: PLAN_LIMITS.free.brandVoices,
          planLimits: { 
            maxGenerations: PLAN_LIMITS.free.generations, 
            maxBrandVoices: PLAN_LIMITS.free.brandVoices 
          },
          notificationPreferences: {
            genComplete: true,
            weeklySum: true,
            monthlyRep: false,
            lowCredits: true,
            billing: true,
            newFeatures: true,
            tips: false,
            security: true
          }
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

const getNotifications = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user.notificationPreferences || {} });
  } catch (error) { next(error); }
};

const updateNotifications = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: req.body },
      { new: true }
    );
    res.json({ success: true, data: user.notificationPreferences });
  } catch (error) { next(error); }
};

const getApiKey = async (req, res, next) => {
  try {
    // Masked API key
    const key = req.user.apiKey || '';
    const masked = key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'No API key generated';
    res.json({ success: true, data: masked });
  } catch (error) { next(error); }
};

const regenerateApiKey = async (req, res, next) => {
  try {
    const newKey = `cg_${crypto.randomBytes(24).toString('hex')}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { apiKey: newKey },
      { new: true }
    );
    res.json({ success: true, data: newKey });
  } catch (error) { next(error); }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.firebaseUid) {
      await admin.auth().deleteUser(user.firebaseUid).catch(err => {
        console.error('Failed to delete Firebase user:', err.message);
      });
    }

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

    if (user.planType === 'razorpay' && user.razorpaySubscriptionId) {
      const { cancelRazorpaySubscription } = require('../services/razorpay.service');
      await cancelRazorpaySubscription(user._id).catch(err => console.error('Failed to cancel Razorpay:', err.message));
    } else if (user.planType === 'dodo' && user.dodoSubscriptionId) {
      const { cancelDodoSubscription } = require('../services/dodo.service');
      await cancelDodoSubscription(user._id).catch(err => console.error('Failed to cancel Dodo:', err.message));
    }

    user.scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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

module.exports = { 
  register, 
  getMe, 
  patchProfile, 
  getNotifications, 
  updateNotifications, 
  getApiKey, 
  regenerateApiKey, 
  deleteAccount, 
  completeOnboarding, 
  getOnboardingStatus 
};
