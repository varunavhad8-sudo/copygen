const Client = require('../models/Client');

// ─────────────────────────────────────────────────────────────────────────────
// clientLimiter
// Limits the number of "Clients" a free user can add.
// Since each Brand Memory profile is linked to a Client, this effectively
// limits the "slots" available for branding.
// ─────────────────────────────────────────────────────────────────────────────
const clientLimiter = async (req, res, next) => {
  try {
    const user = req.user;

    // Free plan limit: 1 Client maximum
    if (user.plan === 'free') {
      const clientCount = await Client.countDocuments({ userId: user._id });
      
      // If they already have 1 client, they can't add another.
      if (clientCount >= 1) {
        return res.status(403).json({
          error: 'CLIENT_LIMIT_REACHED',
          message: 'Free accounts are limited to 1 client. Please upgrade to add more clients and brand voices.',
          upgradeRequired: true,
          limit: 1,
          used: clientCount
        });
      }
    }

    next();
  } catch (error) {
    console.error('[clientLimiter]', error);
    next(error);
  }
};

module.exports = clientLimiter;
