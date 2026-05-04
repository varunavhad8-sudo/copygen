const User = require('../models/User');
const { 
  sendGenerationLimitWarning, 
  sendGenerationLimitExhausted 
} = require('./email.service');

// ─────────────────────────────────────────────────────────────────────────────
// incrementGenerationUsage
// Called after every successful AI generation.
// Increments both the lifetime counter (generationsUsed) and the daily counter.
// ─────────────────────────────────────────────────────────────────────────────
const incrementGenerationUsage = async (userId) => {
  try {
    // 1. Increment usage in DB
    await User.findByIdAndUpdate(userId, {
      $inc: {
        generationsUsed:      1,
        dailyGenerationsUsed: 1
      }
    });

    // 2. Fetch updated user for alert checking
    const user = await User.findById(userId, 'generationsUsed generationsLimit email name plan emailBounced');
    if (!user || user.emailBounced) return;

    const used = user.generationsUsed || 0;
    const limit = user.generationsLimit || 10;

    // 3. Check for limit alerts
    try {
      if (used >= limit) {
        // 100% Limit Hit
        await sendGenerationLimitExhausted(user.email, user.name, { 
          planName: user.plan 
        });
      } else if (used / limit >= 0.8) {
        // 80% Warning
        await sendGenerationLimitWarning(user.email, user.name, { 
          used, 
          limit, 
          planName: user.plan 
        });
      }
    } catch (emailErr) {
      // Log but don't throw - email failure shouldn't break generation flow
      console.error('[UsageService] Failed to send limit alert email:', emailErr);
    }

  } catch (error) {
    console.error('[UsageService] Error incrementing usage:', error);
    // We don't re-throw here to ensure the AI generation response is still returned to the user
  }
};

// Legacy alias — briefController.js imports this name.
const incrementUsage = incrementGenerationUsage;

// ─────────────────────────────────────────────────────────────────────────────
// incrementBrandVoiceUsage
// Called after a new Brand Memory profile is successfully saved for the FIRST
// time (upsert created a new document). Pass isNewProfile = true to increment.
// ─────────────────────────────────────────────────────────────────────────────
const incrementBrandVoiceUsage = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { brandVoicesUsed: 1 }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// decrementBrandVoiceUsage
// Called when a Brand Memory profile is deleted, so the counter stays accurate
// and the user can create a replacement profile without hitting the cap.
// ─────────────────────────────────────────────────────────────────────────────
const decrementBrandVoiceUsage = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { brandVoicesUsed: -1 }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// resetMonthlyUsage
// Called by billing webhook on subscription renewal for paid users.
// ─────────────────────────────────────────────────────────────────────────────
const resetMonthlyUsage = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    generationsUsed: 0
  });
};

module.exports = {
  incrementUsage,               // legacy alias — keep exports stable
  incrementGenerationUsage,
  incrementBrandVoiceUsage,
  decrementBrandVoiceUsage,
  resetMonthlyUsage
};
