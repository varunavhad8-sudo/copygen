const User = require('../models/User');

const incrementUsage = async (userId) => {
  const user = await User.findById(userId);
  user.generationsUsed += 1;
  user.dailyGenerationsUsed += 1;
  await user.save();
  return user;
};

const resetMonthlyUsage = async (userId) => {
  await User.findByIdAndUpdate(userId, { 
    generationsUsed: 0 
  });
};

module.exports = { incrementUsage, resetMonthlyUsage };


