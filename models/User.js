const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String 
  },
  workspace: { 
    type: String, 
    default: '' 
  },
  timezone: { 
    type: String, 
    default: '(UTC+5:30) Mumbai' 
  },
  plan: { 
    type: String, 
    enum: ['free', 'starter', 'growth', 'agency'], 
    default: 'free' 
  },
  avatarKey: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'admin'
  },
  generationsUsed: { 
    type: Number, 
    default: 0 
  },
  generationsLimit: { 
    type: Number, 
    default: 10 
  },
  dailyGenerationsUsed: { 
    type: Number, 
    default: 0 
  },
  lastDailyReset: { 
    type: Date, 
    default: Date.now 
  },

  // Payment Integration Fields
  dodoCustomerId: { 
    type: String 
  },
  dodoSubscriptionId: { 
    type: String, 
    index: true 
  },
  razorpayCustomerId: { 
    type: String 
  },
  razorpaySubscriptionId: { 
    type: String, 
    index: true 
  },
  razorpayPaymentId: { 
    type: String 
  },
  planType: { 
    type: String, 
    enum: ['free', 'dodo', 'razorpay'], 
    default: 'free',
    index: true 
  },
  currentPeriodEnd: { 
    type: Date 
  },

  // Graceful cancellation — keeps premium access until period end
  scheduledDowngrade: {
    type: Boolean,
    default: false
  },
  subscriptionCancelledAt: {
    type: Date
  },

  isTrial: { 
    type: Boolean, 
    default: true 
  },
  trialExpiresAt: { 
    type: Date 
  },
  scheduledDeletionAt: {
    type: Date
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);




