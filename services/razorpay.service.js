const User = require('../models/User');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

/**
 * FUNCTION 1: Create a Razorpay Subscription
 * @param {string} userId - MongoDB _id of the user
 * @param {string} planKey - 'starter', 'growth', or 'agency'
 * @returns {Promise<{subscriptionId: string, shortUrl: string, razorpayKeyId: string}>}
 */
const createRazorpaySubscription = async (userId, planKey, options = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if user already has a Razorpay subscription
    if (user.razorpaySubscriptionId) {
      let isActiveSubscription = false;
      
      try {
        const existingSub = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
        // Only block if the subscription is actually ACTIVE or AUTHENTICATED
        // If it's just 'created', they abandoned the checkout, so let them create a new one!
        if (existingSub && ['authenticated', 'active'].includes(existingSub.status)) {
          isActiveSubscription = true;
        }
      } catch (fetchErr) {
        console.log(`[Razorpay] Subscription ${user.razorpaySubscriptionId} not found on Razorpay.`);
        isActiveSubscription = false;
      }

      if (isActiveSubscription) {
        const error = new Error('ACTIVE_SUBSCRIPTION');
        error.code = 'ACTIVE_SUBSCRIPTION';
        error.planType = 'razorpay';
        throw error;
      }

      // Clear the abandoned/stale subscription so we can generate a fresh one
      console.log(`[Razorpay] Clearing abandoned/stale subscription for user ${userId}`);
      user.razorpaySubscriptionId = null;
      user.razorpayPaymentId = null;
      if (user.planType === 'razorpay') {
        user.plan = 'free';
        user.planType = 'free';
      }
      await user.save();
    }

    // Check if user has an active Dodo subscription
    if (user.dodoSubscriptionId && user.plan !== 'free') {
      const error = new Error('ACTIVE_SUBSCRIPTION');
      error.code = 'ACTIVE_SUBSCRIPTION';
      error.planType = 'dodo';
      throw error;
    }

    // Map planKey + billingCycle to plan_id from environment
    const billingCycle = options?.billingCycle || 'monthly';
    const planMap = {
      'starter-monthly': process.env.RAZORPAY_STARTER_PLAN_ID,
      'growth-monthly':  process.env.RAZORPAY_GROWTH_PLAN_ID,
      'agency-monthly':  process.env.RAZORPAY_AGENCY_PLAN_ID,
      'starter-yearly':  process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID,
      'growth-yearly':   process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID,
      'agency-yearly':   process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID,
      'test-monthly':    process.env.RAZORPAY_TEST_PLAN_ID,
      'test-yearly':     process.env.RAZORPAY_TEST_PLAN_ID,
      'daily_test-monthly': process.env.RAZORPAY_DAILY_TEST_PLAN_ID,
      'daily_test-yearly':  process.env.RAZORPAY_DAILY_TEST_PLAN_ID,
    };

    const planId = planMap[`${planKey}-${billingCycle}`];
    if (!planId) {
      throw new Error(`Plan ID for ${planKey} (${billingCycle}) is not configured`);
    }

    // Define Intro Amounts (₹5,699, ₹11,399, ₹22,799)
    const introMap = {
      'starter': 569900,
      'growth':  1139900,
      'agency':  2279900
    };

    const introAmount = introMap[planKey];

    // Create subscription options
    const subscriptionOptions = {
      plan_id: planId,
      total_count: 120, // 10 years
      quantity: 1,
      customer_notify: 1,
    };

    // If it's a real plan, add the 1st month discount addon and start recurring later
    if (introMap[planKey]) {
      subscriptionOptions.start_at = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      subscriptionOptions.addons = [
        {
          item: {
            name: `${planKey.toUpperCase()} First Month Discount`,
            amount: introMap[planKey],
            currency: 'INR'
          }
        }
      ];
    }

    const subscription = await razorpay.subscriptions.create(subscriptionOptions);

    // Save razorpaySubscriptionId to user in MongoDB
    user.razorpaySubscriptionId = subscription.id;
    await user.save();

    return {
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    };

  } catch (error) {
    // Razorpay SDK throws non-standard error objects — extract real message
    const errMsg = error?.error?.description || error?.message || JSON.stringify(error);
    console.error('Error in createRazorpaySubscription:', errMsg, JSON.stringify(error?.error || error));
    // Re-attach a proper message so callers get a readable error
    if (!error.message) error.message = errMsg;
    throw error;
  }
};

/**
 * FUNCTION 2: Verify Razorpay Payment Signature
 * @param {string} razorpayPaymentId 
 * @param {string} razorpaySubscriptionId 
 * @param {string} razorpaySignature 
 * @returns {boolean}
 */
const verifyRazorpayPayment = (
  razorpayPaymentId, 
  razorpaySubscriptionId, 
  razorpaySignature
) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayPaymentId + '|' + razorpaySubscriptionId)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Error in verifyRazorpayPayment:', error.message);
    return false;
  }
};

/**
 * FUNCTION 3: Cancel Razorpay Subscription
 * @param {string} userId - MongoDB _id of the user
 * @returns {Promise<{success: boolean, message: string}>}
 */
const cancelRazorpaySubscription = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.razorpaySubscriptionId) {
      throw new Error('No active Razorpay subscription found');
    }

    // Request cancellation at end of current billing cycle
    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, 1);

    // Mark as scheduled for downgrade — but KEEP full access until period ends.
    // The actual plan downgrade happens in the webhook handler for
    // 'subscription.completed' (fires when billing period actually expires).
    user.scheduledDowngrade = true;
    user.subscriptionCancelledAt = new Date();
    // DO NOT clear razorpaySubscriptionId — webhook needs it to identify the user
    // DO NOT change plan or generationsLimit — user still paid for this period

    await user.save();

    return {
      success: true,
      message: 'Subscription cancelled. You keep full access until the end of your current billing period.'
    };

  } catch (error) {
    const errMsg = error?.error?.description || error?.message || JSON.stringify(error);
    console.error('Error in cancelRazorpaySubscription:', errMsg, JSON.stringify(error?.error || error));
    throw new Error(errMsg);
  }
};

module.exports = {
  createRazorpaySubscription,
  verifyRazorpayPayment,
  cancelRazorpaySubscription
};


