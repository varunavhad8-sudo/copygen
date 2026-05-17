const User = require('../models/User');
const dodo = require('../config/dodo');

const assertDodoReady = () => {
  if (!dodo) throw new Error('International payments are not configured yet. Please contact support.');
};

/**
 * FUNCTION 1: Create a Dodo Payments subscription checkout session
 * @param {string} userId - MongoDB _id of the user
 * @param {string} planKey - 'starter', 'growth', or 'agency'
 * @returns {Promise<{paymentLink: string, subscriptionId: string}>}
 */
const createDodoSubscription = async (userId, planKey, isAnnual = false) => {
  try {
    assertDodoReady();

    const productIds = {
      starter: isAnnual ? process.env.DODO_STARTER_ANNUAL_PRODUCT_ID : process.env.DODO_STARTER_PRODUCT_ID,
      growth:  isAnnual ? process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID  : process.env.DODO_GROWTH_PRODUCT_ID,
      agency:  isAnnual ? process.env.DODO_AGENCY_ANNUAL_PRODUCT_ID  : process.env.DODO_AGENCY_PRODUCT_ID
    };

    const productId = productIds[planKey];

    if (!productId) {
      throw new Error(`Product ID for ${planKey} (${isAnnual ? 'annual' : 'monthly'}) plan is not configured in environment variables.`);
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check for existing active Dodo subscription
    if (user.dodoSubscriptionId && user.plan !== 'free') {
      const error = new Error('ACTIVE_SUBSCRIPTION');
      error.code = 'ACTIVE_SUBSCRIPTION';
      error.planType = 'dodo';
      throw error;
    }

    // Check for existing active Razorpay subscription
    if (user.razorpaySubscriptionId && user.plan !== 'free') {
      const error = new Error('ACTIVE_SUBSCRIPTION');
      error.code = 'ACTIVE_SUBSCRIPTION';
      error.planType = 'razorpay';
      throw error;
    }

    // Create Dodo Checkout Session
    const sessionData = {
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      customer: {
        email: user.email,
        name: user.name || 'Copygen User'
      }
    };

    // Automatically apply discount for monthly plans if configured
    if (!isAnnual) {
      if (process.env.DODO_DISCOUNT_ID) {
        sessionData.discount_id = process.env.DODO_DISCOUNT_ID;
      } else if (process.env.DODO_DISCOUNT_CODE) {
        sessionData.discount_code = process.env.DODO_DISCOUNT_CODE;
      }
    }

    const session = await dodo.checkoutSessions.create(sessionData);

    // Save session ID temporarily for reference only
    user.dodoCheckoutSessionId = session.session_id; 
    await user.save();
    
    return {
      paymentLink: session.checkout_url,
      subscriptionId: session.session_id
    };

  } catch (error) {
    console.error('Error in createDodoSubscription:', error.message);
    throw error;
  }
};

/**
 * FUNCTION 2: Cancel an active Dodo Payments subscription
 * @param {string} userId - MongoDB _id of the user
 * @returns {Promise<{success: boolean, message: string}>}
 */
const cancelDodoSubscription = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.dodoSubscriptionId) {
      throw new Error('No active Dodo subscription found');
    }

    // Cancel subscription via Dodo SDK
    await dodo.subscriptions.cancel(user.dodoSubscriptionId);

    // Update user in MongoDB - Scheduled Downgrade
    user.scheduledDowngrade = true;
    user.subscriptionCancelledAt = new Date();
    await user.save();

    return { 
      success: true, 
      message: 'Subscription cancelled. You keep full access until the end of your billing period.' 
    };

  } catch (error) {
    console.error('Error in cancelDodoSubscription:', error.message);
    throw new Error(error.message);
  }
};

/**
 * FUNCTION 3: Get the status of a Dodo Payments subscription
 * @param {string} userId - MongoDB _id of the user
 * @returns {Promise<object>}
 */
const getDodoSubscriptionStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.dodoSubscriptionId) {
      return { status: 'none', plan: 'free' };
    }

    if (!user.dodoSubscriptionId || user.dodoSubscriptionId.startsWith('cs_')) {
      return { status: 'pending', plan: user.plan, message: 'Subscription pending confirmation' };
    }

    // Fetch subscription details from Dodo SDK
    // Official SDK method: dodo.subscriptions.retrieve
    const subscription = await dodo.subscriptions.retrieve(user.dodoSubscriptionId);

    return {
      status: subscription.status,
      plan: user.plan,
      subscriptionId: user.dodoSubscriptionId,
      currentPeriodEnd: user.currentPeriodEnd
    };

  } catch (error) {
    console.error('Error in getDodoSubscriptionStatus:', error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  createDodoSubscription,
  cancelDodoSubscription,
  getDodoSubscriptionStatus
};


