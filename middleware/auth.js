const admin = require('../config/firebase');
const User = require('../models/User');
const disposableDomains = require('disposable-email-domains');
const redis = require('../config/redis');

const { PLAN_LIMITS } = require('../config/plans');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decoded.uid });
    
    // If not found by UID, try finding by email to link accounts
    if (!user && decoded.email) {
      const normalizedEmail = decoded.email.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
      
      if (user) {
        console.log('[Auth] Found user by email, linking Firebase UID:', { email: user.email, uid: decoded.uid });
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }

    if (!user) {
      // Disposable Email Check
      const domain = decoded.email.split('@')[1];
      if (disposableDomains.includes(domain)) {
        return res.status(403).json({ message: 'Please use a valid business email address to sign up for CopyGen.' });
      }

      // Per-IP Account Creation Limit Check
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress;
      const redisKey = `signup:ip:${clientIP}`;
      
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, 86400);
      }
      
      if (count > 3) {
        return res.status(429).json({ message: 'Too many accounts created from this location. Please try again tomorrow or contact support@copygen.in.' });
      }

      console.log('[Auth] Creating new user record via middleware:', decoded.email);
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email.toLowerCase().trim(),
        name: decoded.name || '',
        workspace: decoded.name || '',
        plan: 'free',
        isTrial: true,
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    }

    // ── Ban Check ─────────────────────────────────────────────────────────────
    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'ACCOUNT_BANNED',
        message: user.banReason || 'Your account has been suspended. Contact support@copygen.in for assistance.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;



