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
    default: 'Asia/Kolkata (IST)' 
  },
  // ── Region / Currency (used for payment gateway routing) ──────────────────
  country: {
    type: String,
    default: 'IN'   // Default Indian; update for international users at signup
  },
  currency: {
    type: String,
    default: 'INR'  // Default INR; set to 'USD' etc. for international
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
  // ── Notification Preferences ──────────────────────────────────────────────
  notificationPreferences: {
    genComplete: { type: Boolean, default: true },
    weeklySum: { type: Boolean, default: true },
    monthlyRep: { type: Boolean, default: false },
    lowCredits: { type: Boolean, default: true },
    billing: { type: Boolean, default: true },
    newFeatures: { type: Boolean, default: true },
    tips: { type: Boolean, default: false },
    security: { type: Boolean, default: true } // Required/Always on
  },
  // ── API Key ───────────────────────────────────────────────────────────────
  apiKey: {
    type: String,
    default: null
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
    default: 1 // free=1; upgraded by payment webhook on plan change
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
  dodoCheckoutSessionId: {
    type: String,
    default: null
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
    enum: ['free', 'starter', 'growth', 'agency'],
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
  emailBouncedAt: {
    type: Date,
    default: null
  },
  emailBounceType: {
    type: String,
    default: null
  },
  emailBounceReason: {
    type: String,
    default: null
  },
  expiryReminderSent: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
