const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const {
  createRazorpaySubscription,
  verifyRazorpayPayment,
  cancelRazorpaySubscription
} = require('../services/razorpay.service');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── STARTUP CHECK ────────────────────────────────────────────────────────────
if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
  console.warn('');
  console.warn('══════════════════════════════════════════════════════════');
  console.warn('⚠️  WARNING: RAZORPAY_WEBHOOK_SECRET is not set!');
  console.warn('   Webhook signature verification will FAIL for all');
  console.warn('   incoming Razorpay events (plan activations, renewals,');
  console.warn('   cancellations). Set it in your .env file:');
  console.warn('   RAZORPAY_WEBHOOK_SECRET=<from Razorpay Dashboard → Webhooks>');
  console.warn('══════════════════════════════════════════════════════════');
  console.warn('');
}

// ─── AMOUNT → PLAN MAP (in paise) ─────────────────────────────────────────────
const AMOUNT_PLAN_MAP = {
  // New Full Prices
  819900:   { plan: 'starter', limit: 300  }, // ₹8,199/mo
  1639900:  { plan: 'growth',  limit: 1000 }, // ₹16,399/mo
  3279900:  { plan: 'agency',  limit: 3000 }, // ₹32,799/mo
  // New Intro Prices (Month 1 Discount)
  569900:   { plan: 'starter', limit: 300  }, // ₹5,699
  1139900:  { plan: 'growth',  limit: 1000 }, // ₹11,399
  2279900:  { plan: 'agency',  limit: 3000 }, // ₹22,799
  // Annual Prices
  8854900:  { plan: 'starter', limit: 300  }, // ₹88,549/yr
  17710900: { plan: 'growth',  limit: 1000 }, // ₹1,77,109/yr
  35422900: { plan: 'agency',  limit: 3000 }, // ₹3,54,229/yr
  // Test Plan (Upgrades to Starter)
  100:      { plan: 'starter', limit: 30   }, // ₹1
};

const genLimits = {
  starter: 300,
  growth: 1000,
  agency: 3000,
  test: 30
};

const voiceLimits = {
  starter: 10,
  growth: 30,
  agency: 100,
  test: 10
};

// Plan ID to Details Map (used for webhooks)
const PLAN_ID_MAP = {
  [process.env.RAZORPAY_STARTER_PLAN_ID]:        { plan: 'starter', limit: 300 },
  [process.env.RAZORPAY_GROWTH_PLAN_ID]:         { plan: 'growth',  limit: 1000 },
  [process.env.RAZORPAY_AGENCY_PLAN_ID]:         { plan: 'agency',  limit: 3000 },
  [process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID]: { plan: 'starter', limit: 300 },
  [process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID]:  { plan: 'growth',  limit: 1000 },
  [process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID]:  { plan: 'agency',  limit: 3000 },
  [process.env.RAZORPAY_TEST_PLAN_ID]:           { plan: 'starter', limit: 30 },
};

/**
 * ROUTE 1: Create a Razorpay Subscription
 * POST /api/billing/razorpay/subscribe
 */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planKey, billingCycle = 'monthly' } = req.body;

    const validPlans = ['starter', 'growth', 'agency', 'test'];
    if (!validPlans.includes(planKey)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const result = await createRazorpaySubscription(req.user._id, planKey, { billingCycle });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 2: Verify Razorpay Payment Signature
 * POST /api/billing/razorpay/verify
 */
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
      planKey
    } = req.body;

    if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature || !planKey) {
      return res.status(400).json({ error: 'Required payment verification fields are missing' });
    }

    const isValid = verifyRazorpayPayment(razorpayPaymentId, razorpaySubscriptionId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ error: 'Payment verification failed. Contact support.' });
    }

    let finalPlan = planKey;
    let finalLimit = genLimits[planKey] || 10;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    if (planKey === 'test') {
      finalPlan = 'starter';
      finalLimit = 30;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.previousPlan = user.plan;
    user.plan = finalPlan;
    user.planType = 'razorpay';
    user.generationsLimit = finalLimit;
    user.brandVoicesLimit = planKey === 'starter' ? 10 : planKey === 'growth' ? 30 : planKey === 'agency' ? 100 : 1;
    user.isTrial = false;
    user.scheduledDowngrade = false;
    user.subscriptionCancelledAt = null;
    user.razorpayPaymentId = razorpayPaymentId;
    user.currentPeriodEnd = periodEnd;

    await user.save();

    res.status(200).json({ success: true, plan: finalPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 3: Cancel Razorpay Subscription
 * POST /api/billing/razorpay/cancel
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    const result = await cancelRazorpaySubscription(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 4: Fetch Razorpay Plans
 * GET /api/billing/razorpay/plans
 */
router.get('/plans', auth, async (req, res) => {
  try {
    const razorpay = require('../config/razorpay');
    const plans = await razorpay.plans.all();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 4: Razorpay Webhook (Unauthenticated)
 * POST /api/billing/razorpay/webhook
 *
 * Event handling strategy:
 *   subscription.activated  → Activate plan (also fires after verify, acts as backup)
 *   subscription.cancelled  → Mark scheduledDowngrade = true, keep plan active until period end
 *   subscription.completed  → Billing cycle ended naturally, NOW downgrade to free
 *   subscription.halted     → Payment failed repeatedly, downgrade immediately
 *   payment.captured        → Update last payment ID for records
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.error('❌ Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured');
      return res.status(401).json({ error: 'Webhook secret not configured' });
    }

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    const expectedSigBuf = Buffer.from(expectedSig, 'utf8');
    const incomingSigBuf = Buffer.from(signature, 'utf8');

    if (expectedSigBuf.length !== incomingSigBuf.length || !crypto.timingSafeEqual(expectedSigBuf, incomingSigBuf)) {
      console.error('❌ Razorpay Webhook: Signature mismatch — possible spoofed request');
      return res.status(401).json({ error: 'Signature mismatch' });
    }

    const { event, payload } = JSON.parse(req.body);
    console.log(`📩 Razorpay Webhook: ${event}`);

    const subscription = payload?.subscription?.entity ?? null;
    const payment      = payload?.payment?.entity ?? null;

    switch (event) {

      // ── Plan Activated (backup to /verify route) ────────────────────────────
      case 'subscription.activated': {
        if (!subscription) break;

        const amount  = subscription.plan_id_entity?.amount || 0;
        const planId  = subscription.plan_id;
        
        // Try matching by plan_id first (most reliable)
        let matched = PLAN_ID_MAP[planId];
        
        // Fallback to amount matching
        if (!matched) {
          matched = AMOUNT_PLAN_MAP[amount];
        }

        if (!matched) {
          console.warn(`⚠️  subscription.activated: Unknown plan ${planId} / amount ${amount} — user not updated`);
          break;
        }

        const user = await User.findOne({ razorpaySubscriptionId: subscription.id });
        if (user) {
          user.previousPlan = user.plan;
          user.plan = matched.plan;
          user.planType = 'razorpay';
          user.generationsLimit = matched.limit;
          user.brandVoicesLimit = matched.plan === 'starter' ? 10 : matched.plan === 'growth' ? 30 : matched.plan === 'agency' ? 100 : 1;
          user.isTrial = false;
          user.scheduledDowngrade = false;
          user.subscriptionCancelledAt = null;
          user.currentPeriodEnd = new Date(subscription.current_end * 1000);
          await user.save();
        }

        console.log(`✅ subscription.activated → plan: ${matched.plan}`);
        break;
      }

      // ── User Cancelled → Keep Access Until Period End ───────────────────────
      // Razorpay fires this immediately when cancel_at_cycle_end is requested.
      // The user's current billing period is still valid — DO NOT downgrade yet.
      case 'subscription.cancelled': {
        if (!subscription) break;

        const user = await User.findOneAndUpdate(
          { razorpaySubscriptionId: subscription.id },
          {
            scheduledDowngrade: true,
            subscriptionCancelledAt: new Date(),
            // Keep plan, generationsLimit, and razorpaySubscriptionId intact
            // currentPeriodEnd already set from activation — keep it
          }
        );

        if (user) {
          const { 
            sendCancellationConfirmation, 
            sendDowngradeNotification, 
            sendPaymentInvoice 
          } = require('../services/email.service');
          sendCancellationConfirmation(user.email, user.name, {
            planName: user.plan,
            accessUntil: user.currentPeriodEnd
          });
        }

        console.log(`🗓  subscription.cancelled → access preserved until currentPeriodEnd`);
        break;
      }

      // ── Billing Cycle Ended / Subscription Completed → NOW Downgrade ────────
      // Fires when the subscription's total_count is exhausted OR the period
      // after a cancel_at_cycle_end subscription actually ends.
      case 'subscription.completed':
      case 'subscription.expired': {
        if (!subscription) break;

        const user = await User.findOne({ razorpaySubscriptionId: subscription.id });
        if (user) {
          user.previousPlan = user.plan;
          user.plan = 'free';
          user.planType = 'free';
          user.generationsLimit = 10;
          user.brandVoicesLimit = 1;
          user.scheduledDowngrade = false;
          user.subscriptionCancelledAt = null;
          user.razorpaySubscriptionId = null;
          user.razorpayPaymentId = null;
          user.currentPeriodEnd = null;
          await user.save();

          try {
            const { sendDowngradeNotification } = require('../services/email.service');
            sendDowngradeNotification(user.email, user.name, { 
              previousPlan: user.previousPlan || 'paid' 
            });
          } catch (emailErr) {
            console.error('[RazorpayWebhook] Downgrade email failed:', emailErr.message);
          }
        }

        console.log(`⬇️  subscription.completed/expired → downgraded to free`);
        break;
      }

      // ── Payment Failed Repeatedly → Immediate Downgrade ─────────────────────
      // Halted means Razorpay gave up retrying. User has not paid — remove access.
      case 'subscription.halted': {
        if (!subscription) break;

        const user = await User.findOne({ razorpaySubscriptionId: subscription.id });
        if (user) {
          user.previousPlan = user.plan;
          user.plan = 'free';
          user.planType = 'free';
          user.generationsLimit = 10;
          user.brandVoicesLimit = 1;
          user.scheduledDowngrade = false;
          user.subscriptionCancelledAt = null;
          user.razorpaySubscriptionId = null;
          await user.save();
        }

        console.log(`🚫 subscription.halted → immediate downgrade (payment failure)`);
        break;
      }

      // ── Payment Captured → Update Latest Payment ID ──────────────────────────
      case 'payment.captured': {
        if (!payment?.subscription_id) break;

        const user = await User.findOneAndUpdate(
          { razorpaySubscriptionId: payment.subscription_id },
          { razorpayPaymentId: payment.id },
          { new: true }
        );

        if (user) {
          try {
            const { sendPaymentInvoice } = require('../services/email.service');
            sendPaymentInvoice(
              user.email, 
              user.name, 
              user.plan, 
              (payment.amount / 100).toFixed(2)
            );
          } catch (emailErr) {
            console.error('[RazorpayWebhook] Invoice email failed:', emailErr.message);
          }
        }

        console.log(`💳 payment.captured for subscription: ${payment.subscription_id}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled Razorpay event: ${event}`);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Razorpay Webhook Error:', error.message);
    // Return 200 anyway to prevent Razorpay from retrying (we log the error above)
    res.status(200).json({ received: true, error: error.message });
  }
});

module.exports = router;
