const cron = require('node-cron');
const User = require('../models/User');
const { 
  sendGetStartedNudge, 
  sendAccessExpiryReminder, 
  sendDowngradeNotification, 
  sendWinbackEmail 
} = require('../services/email.service');

/**
 * Job 1: Get Started Nudge
 * Runs daily at 10:00 AM
 * Target: Free users created 23-25 hours ago who haven't used generations.
 */
const runGetStartedNudgeJob = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rangeStart = new Date(oneDayAgo.getTime() - 60 * 60 * 1000); // 25h ago
    const rangeEnd = new Date(oneDayAgo.getTime() + 60 * 60 * 1000);   // 23h ago

    const users = await User.find({
      plan: 'free',
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
      emailBounced: { $ne: true },
      $or: [
        { generationsUsed: 0 },
        { generationsUsed: { $exists: false } }
      ]
    });

    let sentCount = 0;
    for (const user of users) {
      const { success } = await sendGetStartedNudge(user.email, user.name);
      if (success) sentCount++;
    }

    if (sentCount > 0) {
      console.log(`[Cron] GetStartedNudge: Sent ${sentCount} emails.`);
    }
  } catch (error) {
    console.error('[Cron] Error in GetStartedNudge job:', error);
  }
};

/**
 * Job 2: Access Expiry Reminder
 * Runs daily at 9:00 AM
 * Target: Users with scheduled downgrade expiring in next 72 hours.
 */
const runAccessExpiryReminderJob = async () => {
  try {
    const now = new Date();
    const seventyTwoHoursFromNow = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const users = await User.find({
      scheduledDowngrade: true,
      emailBounced: { $ne: true },
      currentPeriodEnd: { $gte: now, $lte: seventyTwoHoursFromNow }
    });

    let sentCount = 0;
    for (const user of users) {
      const { success } = await sendAccessExpiryReminder(user.email, user.name, {
        planName: user.plan,
        accessUntil: user.currentPeriodEnd
      });
      if (success) sentCount++;
    }

    if (sentCount > 0) {
      console.log(`[Cron] AccessExpiryReminder: Sent ${sentCount} emails.`);
    }
  } catch (error) {
    console.error('[Cron] Error in AccessExpiryReminder job:', error);
  }
};

/**
 * Job 3: Winback Email
 * Runs daily at 11:00 AM
 * Target: Users who cancelled/downgraded 6-8 days ago and haven't been sent a winback yet.
 */
const runWinbackJob = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rangeStart = new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000); // 8 days ago
    const rangeEnd = new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000);   // 6 days ago

    const users = await User.find({
      plan: 'free',
      scheduledDowngrade: { $ne: true },
      emailBounced: { $ne: true },
      subscriptionCancelledAt: { $gte: rangeStart, $lte: rangeEnd },
      winbackSent: { $ne: true }
    });

    let sentCount = 0;
    for (const user of users) {
      const { success } = await sendWinbackEmail(user.email, user.name, {
        previousPlan: user.previousPlan || 'paid'
      });
      
      if (success) {
        user.winbackSent = true;
        await user.save();
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(`[Cron] WinbackJob: Sent ${sentCount} emails.`);
    }
  } catch (error) {
    console.error('[Cron] Error in Winback job:', error);
  }
};

/**
 * Initializes all email-related cron jobs
 */
const initEmailJobs = () => {
  // Job 1: 10:00 AM daily
  cron.schedule('0 10 * * *', runGetStartedNudgeJob);
  
  // Job 2: 09:00 AM daily
  cron.schedule('0 9 * * *', runAccessExpiryReminderJob);
  
  // Job 3: 11:00 AM daily
  cron.schedule('0 11 * * *', runWinbackJob);

  console.log('✅ Scheduled Jobs initialized: Email Lifecycle (Nudge, Expiry, Winback)');
};

module.exports = {
  initEmailJobs
};
