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
    enum: ['free', 'starter', 'pro', 'growth', 'agency'], 
    default: 'free' 
  },
  avatarKey: {
    type: String,
    default: ''
  },
  // ── Flat usage counters (kept for backward compat) ─────────────────────────
  generationsUsed: { 
    type: Number, 
    default: 0 
  },
  generationsLimit: { 
    type: Number, 
    default: 10 
  },
  brandVoicesLimit: {
    type: Number,
    default: 10 // starter=10, growth=30, agency=100
  },
  dailyGenerationsUsed: { 
    type: Number, 
    default: 0 
  },
  lastDailyReset: { 
    type: Date, 
    default: Date.now 
  },

  // ── Free Trial Limits ────────────────────────────────────────────────────────
  // generationsUsed is the source of truth for the 10-generation lifetime limit.
  // brandVoicesUsed tracks how many Brand Memory profiles this user has saved.
  brandVoicesUsed: {
    type: Number,
    default: 0
  },
  planLimits: {
    maxGenerations: { type: Number, default: 10 },
    maxBrandVoices:  { type: Number, default: 1 }
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
  previousPlan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'growth', 'agency'],
    default: 'free'
  },
  winbackSent: {
    type: Boolean,
    default: false
  },
  emailBounced: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);




