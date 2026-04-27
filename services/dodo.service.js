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
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Map planKey to product ID from environment
    let productId;
    switch (planKey) {
      case 'starter':
        productId = process.env.DODO_STARTER_PRODUCT_ID;
        break;
      case 'growth':
        productId = process.env.DODO_GROWTH_PRODUCT_ID;
        break;
      case 'agency':
        productId = process.env.DODO_AGENCY_PRODUCT_ID;
        break;
      default:
        throw new Error('Invalid plan selected');
    }

    if (!productId) {
      throw new Error(`Product ID for ${planKey} is not configured in environment variables`);
    }

    // Check for existing active subscription
    if (user.dodoSubscriptionId) {
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
    // CHECK DODO DOCS FOR EXACT METHOD NAME: Likely dodo.subscriptions.update(id, { status: 'cancelled' })
    await dodo.subscriptions.update(user.dodoSubscriptionId, {
      status: 'cancelled'
    });

    // Update user in MongoDB
    user.plan = 'free';
    user.planType = 'free';
    user.generationsLimit = 10;
    user.dodoSubscriptionId = null;
    user.dodoCustomerId = null;
    
    await user.save();

    return { success: true, message: 'Subscription cancelled' };

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


