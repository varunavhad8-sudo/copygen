const cron = require('node-cron');
const User = require('../models/User');

/**
 * Resets the monthly `generationsUsed` counter for all paid users.
 * Does not touch `dailyGenerationsUsed`.
 */
const runMonthlyReset = async () => {
  try {
    console.log('[Cron] Starting monthly generations limit reset...');
    
    // We want to reset generationsUsed for any user who is on a paid plan
    // Note: The prompt asks for subscriptionStatus is 'active', but looking at the User model,
    // the field is `plan` (starter, growth, agency) and `planType` (razorpay, dodo).
    // Let's reset everyone who is NOT on the 'free' plan.
    const result = await User.updateMany(
      { plan: { $ne: 'free' } },
      { $set: { generationsUsed: 0 } }
    );
    
    console.log(`[Cron] Successfully reset monthly generations for ${result.modifiedCount} paid users.`);
    return result.modifiedCount;
  } catch (error) {
    console.error('[Cron] Error resetting monthly generations:', error);
    throw error;
  }
};

/**
 * Initializes the cron job to run at 00:00 on the 1st of every month
 */
const initMonthlyResetJob = () => {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  cron.schedule('0 0 1 * *', async () => {
    await runMonthlyReset();
  });
  console.log('✅ Scheduled Job initialized: Monthly generation reset (runs on the 1st of every month)');
};

module.exports = {
  initMonthlyResetJob,
  runMonthlyReset
};
