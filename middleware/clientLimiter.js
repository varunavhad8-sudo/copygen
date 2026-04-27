const Client = require('../models/Client');

const clientLimiter = async (req, res, next) => {
  const user = req.user;

  if (user.isTrial) {
    // Check if trial is expired first
    if (new Date() > new Date(user.trialExpiresAt)) {
      return res.status(403).json({
        message: 'Your trial has expired. Please upgrade to add more clients.',
        upgradeRequired: true
      });
    }

    // Check client count
    const clientCount = await Client.countDocuments({ userId: user._id });
    if (clientCount >= 1) {
      return res.status(403).json({
        message: 'Trial limit reached: You can only add 1 client during your trial period. Please upgrade to add more clients.',
        limitReached: true,
        upgradeRequired: true
      });
    }
  }

  next();
};

module.exports = clientLimiter;



