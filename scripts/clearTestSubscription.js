require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// --- SETTINGS ---
const EMAIL_TO_CLEAR = 'varunavhad8@gmail.com';

async function clearSubscription() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log(`Finding user: ${EMAIL_TO_CLEAR}...`);
    const user = await User.findOne({ email: EMAIL_TO_CLEAR.toLowerCase() });

    if (!user) {
      console.log('User not found.');
      return;
    }

    console.log('User found. Current state:', {
      email: user.email,
      plan: user.plan,
      planType: user.planType,
      razorpaySubscriptionId: user.razorpaySubscriptionId,
      razorpayPaymentId: user.razorpayPaymentId
    });

    // Clear fields as requested
    user.razorpaySubscriptionId = null;
    user.razorpayPaymentId = null;
    user.plan = 'free';
    user.planType = 'free';
    user.scheduledDowngrade = false;
    user.subscriptionCancelledAt = null;
    
    // Additional cleanup for consistency
    user.currentPeriodEnd = null;
    user.generationsLimit = 10;
    user.brandVoicesLimit = 1;

    await user.save();
    console.log('Done: User subscription fields cleared successfully.');

  } catch (error) {
    console.error('Failure:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

clearSubscription();
