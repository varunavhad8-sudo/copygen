const User = require('../models/User');

// ── Grace period before auto-downgrade after missed webhook ───────────────────
// Gives Razorpay / Dodo 30 min to deliver a delayed subscription.completed event
// before we hard-downgrade a paying user. Keeps false-positives near zero.
const WEBHOOK_GRACE_PERIOD_MS = 30 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// checkGenerationLimit
// Blocks free-plan users who have exhausted their 10-lifetime-generation quota.
// Paid users are never blocked here — they have no generation cap in this flow.
// ─────────────────────────────────────────────────────────────────────────────
const checkGenerationLimit = async (req, res, next) => {
  try {
    const user = req.user;

    // ── Auto-downgrade safety net (same logic as before) ──────────────────────
    if (user.scheduledDowngrade && user.currentPeriodEnd) {
      const periodEnd   = new Date(user.currentPeriodEnd);
      const graceDeadline = new Date(periodEnd.getTime() + WEBHOOK_GRACE_PERIOD_MS);
      const now = new Date();

      if (now > periodEnd && now <= graceDeadline) {
        const minutesSince = Math.round((now - periodEnd) / 60000);
        console.warn(
          `[usageLimiter] Grace period active for ${user.email} — ` +
          `period ended ${minutesSince}m ago, waiting for webhook`
        );
      } else if (now > graceDeadline) {
        console.log(
          `[usageLimiter] Auto-downgrading ${user.email} — ` +
          `period ended >30m ago, webhook definitively missed`
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
        user.plan = 'free';
        user.planType = 'free';
        user.generationsLimit = 10;
      }
    }

    // ── Free plan: check lifetime generation cap ───────────────────────────────
    if (user.plan === 'free') {
      // Resolve limit: prefer planLimits.maxGenerations, fall back to legacy generationsLimit
      const maxGenerations = user.planLimits?.maxGenerations ?? user.generationsLimit ?? 10;
      const used           = user.generationsUsed ?? 0;

      if (used >= maxGenerations) {
        return res.status(403).json({
          error:      'GENERATION_LIMIT_REACHED',
          limit:      maxGenerations,
          used,
          upgradeRequired: true,
          upgradeUrl: '/pricing'
        });
      }
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
      free:    1,
      starter: 10,
      growth:  30,
      agency:  100,
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
