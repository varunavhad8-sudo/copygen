const admin = require('../config/firebase');
const User = require('../models/User');
const disposableDomains = require('disposable-email-domains');
const redis = require('../config/redis');


const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decoded.uid });
    
    if (!user) {
      // Disposable Email Check
      const domain = decoded.email.split('@')[1];
      if (disposableDomains.includes(domain)) {
        return res.status(403).json({ message: 'Please use a valid business email address to sign up for CopyGen.' });
      }

      // Per-IP Account Creation Limit Check
      // Use x-forwarded-for if behind a proxy like Cloudflare/Nginx, else fallback to req.ip
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress;
      const redisKey = `signup:ip:${clientIP}`;
      
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, 86400); // 24 hours
      }
      
      if (count > 3) {
        return res.status(429).json({ message: 'Too many accounts created from this location. Please try again tomorrow or contact support@copygen.in.' });
      }

      // Proceed with user creation
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name || '',
        plan: 'free',
        isTrial: false,
        generationsUsed: 0,
        generationsLimit: 10,
        brandVoicesUsed: 0,
        planLimits: { maxGenerations: 10, maxBrandVoices: 1 }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;



