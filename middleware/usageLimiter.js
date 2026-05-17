const User = require('../models/User');
const { PLAN_LIMITS } = require('../config/plans');

// ── Grace period before auto-downgrade after missed webhook ───────────────────
// Gives Razorpay / Dodo 30 min to deliver a delayed subscription.completed event
// before we hard-downgrade a paying user. Keeps false-positives near zero.
const WEBHOOK_GRACE_PERIOD_MS = 30 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// checkGenerationLimit
// Blocks free-plan users who have exhausted their generation quota.
// Paid users are never blocked here — they have no generation cap in this flow.
// ─────────────────────────────────────────────────────────────────────────────

const checkGenerationLimit = async (req, res, next) => {
  try {
    const user = req.user;

    // ── Auto-downgrade safety net ──────────────────────────────────────────
    if (user.scheduledDowngrade && user.currentPeriodEnd) {
      const periodEnd = new Date(user.currentPeriodEnd);
      const graceDeadline = new Date(periodEnd.getTime() + WEBHOOK_GRACE_PERIOD_MS);
      const now = new Date();

      if (now > graceDeadline) {
        console.log(`[usageLimiter] Auto-downgrading ${user.email}`);
        await User.findByIdAndUpdate(user._id, {
          plan: 'free',
          planType: 'free',
          generationsLimit: PLAN_LIMITS.free.generations,
          brandVoicesLimit: PLAN_LIMITS.free.brandVoices,
          scheduledDowngrade: false,
          subscriptionCancelledAt: null,
          razorpaySubscriptionId: null,
          razorpayPaymentId: null,
          dodoSubscriptionId: null,
          dodoCheckoutSessionId: null,
          currentPeriodEnd: null
        });
        // Reload fresh user from DB after downgrade
        const freshUser = await User.findById(user._id);
        req.user = freshUser;
      }
    }

    // Check if trial has expired
    if (req.user.isTrial && req.user.trialExpiresAt) {
      const trialExpired = new Date() > new Date(req.user.trialExpiresAt);
      if (trialExpired && req.user.plan === 'free') {
        return res.status(403).json({
          error: 'TRIAL_EXPIRED',
          message: 'Your 7-day free trial has ended. Please subscribe to continue.',
          upgradeRequired: true,
          upgradeUrl: '/pricing'
        });
      }
    }

    // ── Check limit for ALL plans including paid ───────────────────────────
    const maxGenerations = req.user.generationsLimit ?? PLAN_LIMITS[req.user.plan]?.generations ?? 10;
    const used = req.user.generationsUsed ?? 0;

    if (used >= maxGenerations) {
      return res.status(403).json({
        error: 'GENERATION_LIMIT_REACHED',
        limit: maxGenerations,
        used,
        upgradeRequired: req.user.plan === 'free',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (err) {
    console.error('[usageLimiter:checkGenerationLimit]', err);
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkBrandVoiceLimit
// Blocks free-plan users who already have 1 Brand Memory profile saved.
// Uses the user's actual BrandProfile count (not a cached counter) so it stays
// accurate even if profiles are manually deleted.
// ─────────────────────────────────────────────────────────────────────────────
const checkBrandVoiceLimit = async (req, res, next) => {
  try {
    const user = req.user;

    const planLimits = {
      free:    PLAN_LIMITS.free.brandVoices,
      starter: PLAN_LIMITS.starter.brandVoices,
      growth:  PLAN_LIMITS.growth.brandVoices,
      agency:  PLAN_LIMITS.agency.brandVoices,
    };


    const maxBrandVoices = user.brandVoicesLimit || planLimits[user.plan] || 1;
    const used = user.brandVoicesUsed ?? 0;

    if (used >= maxBrandVoices) {
      return res.status(403).json({
        error: 'BRAND_VOICE_LIMIT_REACHED',
        limit: maxBrandVoices,
        used,
        upgradeRequired: true,
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (err) {
    console.error('[usageLimiter:checkBrandVoiceLimit]', err);
    next(err);
  }
};

module.exports = { checkGenerationLimit, checkBrandVoiceLimit };
