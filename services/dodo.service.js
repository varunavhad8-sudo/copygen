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
const createDodoSubscription = async (userId, planKey) => {
  try {
    assertDodoReady();

    const productIds = {
      starter: process.env.DODO_STARTER_PRODUCT_ID,
      growth:  process.env.DODO_GROWTH_PRODUCT_ID,
      agency:  process.env.DODO_AGENCY_PRODUCT_ID
    };

    const productId = productIds[planKey];

    if (!productId) {
      throw new Error(`Product ID for ${planKey} plan is not configured in environment variables. Check DODO_${planKey.toUpperCase()}_PRODUCT_ID in .env`);
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check for existing active subscription
    if (user.dodoSubscriptionId && user.plan !== 'free') {
      throw new Error('You already have an active subscription. Please cancel it before subscribing to a new plan.');
    }

    // Create Dodo Checkout Session
    // Official SDK method: dodo.checkoutSessions.create
    const session = await dodo.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      customer: {
        email: user.email,
        name: user.name || 'Copygen User'
      }
    });

    // Save session ID as an initial reference if needed, 
    // though the real subscription ID comes from webhooks.
    // For this implementation, we follow the request to save it.
    user.dodoSubscriptionId = session.session_id; 
    await user.save();
    
    return {
      paymentLink: session.checkout_url,
      subscriptionId: session.session_id
    };

  } catch (error) {
    console.error('Error in createDodoSubscription:', error.message);
    throw new Error(error.message);
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


