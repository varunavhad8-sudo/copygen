const User = require('../models/User');

// ── 30-minute grace period before auto-downgrade after missed webhook ─────────
// This prevents legitimate paying users from being locked out when Razorpay or
// Dodo delivers a webhook slightly late (common during peak server loads).
const WEBHOOK_GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

const usageLimiter = async (req, res, next) => {
  const user = req.user;
  const today = new Date();

  // ── 1. Auto-downgrade if scheduled downgrade period has passed ──────────────
  // Safety net if the subscription.completed webhook is delayed or missed.
  // Checks: user requested cancellation AND billing period has ended AND grace period passed.
  if (user.scheduledDowngrade && user.currentPeriodEnd) {
    const periodEnd = new Date(user.currentPeriodEnd);
    const graceDeadline = new Date(periodEnd.getTime() + WEBHOOK_GRACE_PERIOD_MS);
    const pastGrace = today > graceDeadline;

    if (today > periodEnd && !pastGrace) {
      // Period ended but still within grace window — log and allow through
      const minutesSincePeriodEnd = Math.round((today - periodEnd) / 60000);
      console.warn(
        `[usageLimiter] Grace period active for ${user.email} — ` +
        `period ended ${minutesSincePeriodEnd}m ago, waiting for webhook (grace: 30m)`
      );
    } else if (pastGrace) {
      // Grace period expired — webhook is definitively late, auto-downgrade
      console.log(
        `[usageLimiter] Auto-downgrading ${user.email} — ` +
        `period ended >30m ago, webhook definitely missed`
      );
      await User.findByIdAndUpdate(user._id, {
        plan: 'free',
        planType: 'free',
        generationsLimit: 10,
        scheduledDowngrade: false,
        subscriptionCancelledAt: null,
        razorpaySubscriptionId: null,
        razorpayPaymentId: null,
        currentPeriodEnd: null
      });
      // Mutate local user object so checks below reflect reality immediately
      user.plan = 'free';
      user.planType = 'free';
      user.generationsLimit = 10;
    }
  }

  // ── 2. Reset daily count if it's a new day ──────────────────────────────────
  const lastReset = new Date(user.lastDailyReset);
  if (lastReset.toDateString() !== today.toDateString()) {
    user.dailyGenerationsUsed = 0;
    user.lastDailyReset = today;
    await user.save();
  }

  // ── 3. Trial Expiration Check ───────────────────────────────────────────────
  if (user.isTrial) {
    if (user.trialExpiresAt && today > new Date(user.trialExpiresAt)) {
      return res.status(403).json({
        message: 'Your 7-day free trial has expired. Please upgrade to continue generating content.',
        trialExpired: true,
        upgradeRequired: true
      });
    }

    // Trial daily limit (5 per day)
    if (user.dailyGenerationsUsed >= 5) {
      return res.status(403).json({
        message: 'Trial daily limit of 5 generations reached. Upgrade for higher limits.',
        dailyLimitReached: true,
        resetTime: 'midnight'
      });
    }
  }

  // ── 4. Paid Plan Monthly Limit Check ───────────────────────────────────────
  if (!user.isTrial && user.generationsUsed >= user.generationsLimit) {
    return res.status(403).json({
      message: 'Monthly generation limit reached. Please upgrade your plan.',
      upgradeRequired: true,
      currentPlan: user.plan
    });
  }

  next();
};

module.exports = usageLimiter;
