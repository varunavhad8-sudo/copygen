const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const {
  createRazorpaySubscription,
  verifyRazorpayPayment,
  cancelRazorpaySubscription
} = require('../services/razorpay.service');
const auth = require('../middleware/auth');

const router = express.Router();
const { PLAN_LIMITS } = require('../config/plans');


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
  819900:   { plan: 'starter', limit: PLAN_LIMITS.starter.generations  }, // ₹8,199/mo
  1639900:  { plan: 'growth',  limit: PLAN_LIMITS.growth.generations }, // ₹16,399/mo
  3279900:  { plan: 'agency',  limit: PLAN_LIMITS.agency.generations }, // ₹32,799/mo
  // New Intro Prices (Month 1 Discount)
  569900:   { plan: 'starter', limit: PLAN_LIMITS.starter.generations  }, // ₹5,699
  1139900:  { plan: 'growth',  limit: PLAN_LIMITS.growth.generations }, // ₹11,399
  2279900:  { plan: 'agency',  limit: PLAN_LIMITS.agency.generations }, // ₹22,799
  // Annual Prices
  8854900:  { plan: 'starter', limit: PLAN_LIMITS.starter.generations  }, // ₹88,549/yr
  17710900: { plan: 'growth',  limit: PLAN_LIMITS.growth.generations }, // ₹1,77,109/yr
  35422900: { plan: 'agency',  limit: PLAN_LIMITS.agency.generations }, // ₹3,54,229/yr
};


const genLimits = {
  starter: PLAN_LIMITS.starter.generations,
  growth: PLAN_LIMITS.growth.generations,
  agency: PLAN_LIMITS.agency.generations,
};

const voiceLimits = {
  starter: PLAN_LIMITS.starter.brandVoices,
  growth: PLAN_LIMITS.growth.brandVoices,
  agency: PLAN_LIMITS.agency.brandVoices,
};


// Plan ID to Details Map (used for webhooks)
const PLAN_ID_MAP = {
  [process.env.RAZORPAY_STARTER_PLAN_ID]:        { plan: 'starter', limit: PLAN_LIMITS.starter.generations },
  [process.env.RAZORPAY_GROWTH_PLAN_ID]:         { plan: 'growth',  limit: PLAN_LIMITS.growth.generations },
  [process.env.RAZORPAY_AGENCY_PLAN_ID]:         { plan: 'agency',  limit: PLAN_LIMITS.agency.generations },
  [process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID]: { plan: 'starter', limit: PLAN_LIMITS.starter.generations },
  [process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID]:  { plan: 'growth',  limit: PLAN_LIMITS.growth.generations },
  [process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID]:  { plan: 'agency',  limit: PLAN_LIMITS.agency.generations },
};


/**
 * ROUTE 1: Create a Razorpay Subscription
 * POST /api/billing/razorpay/subscribe
 */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planKey, billingCycle = 'monthly' } = req.body;

    const validPlans = ['starter', 'growth', 'agency'];
    if (!validPlans.includes(planKey)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    const result = await createRazorpaySubscription(req.user._id, planKey, { billingCycle });
    res.status(200).json(result);
  } catch (error) {
    if (error.code === 'ACTIVE_SUBSCRIPTION') {
      return res.status(409).json({
        error: 'ACTIVE_SUBSCRIPTION',
        message: 'You already have an active subscription.',
        planType: error.planType || 'razorpay'
      });
    }
    // Razorpay SDK throws plain objects { statusCode, error: { description } }
    const errMsg = error?.error?.description || error?.message || 'Subscription creation failed';
    console.error('[RazorpaySubscribe] Error:', errMsg, JSON.stringify(error?.error || error));
    res.status(500).json({ error: errMsg, razorpayError: error?.error || null });
  }
});

/**
 * ROUTE 2: Verify Razorpay Payment Signature
 * POST /api/razorpay/verify
 */
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
      planKey
    } = req.body;

    console.log('[RazorpayVerify] Received:', { razorpayPaymentId, razorpaySubscriptionId, planKey });

    if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature || !planKey) {
      console.error('[RazorpayVerify] Missing fields:', { razorpayPaymentId: !!razorpayPaymentId, razorpaySubscriptionId: !!razorpaySubscriptionId, razorpaySignature: !!razorpaySignature, planKey });
      return res.status(400).json({ error: 'Required payment verification fields are missing' });
    }

    // Always verify the Razorpay payment signature — no dev bypass allowed
    const isValid = verifyRazorpayPayment(razorpayPaymentId, razorpaySubscriptionId, razorpaySignature);
    if (!isValid) {
      console.error('[RazorpayVerify] Signature mismatch for payment:', razorpayPaymentId);
      return res.status(400).json({ error: 'Payment verification failed. Contact support.' });
    }

    const validVerifyPlans = ['starter', 'growth', 'agency'];
    if (!validVerifyPlans.includes(planKey)) {
      return res.status(400).json({ error: 'Invalid plan key in verification request' });
    }

    const finalPlan = planKey;
    const finalLimit = genLimits[planKey] || 10;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.previousPlan = user.plan;
    user.plan = finalPlan;
    user.planType = 'razorpay';
    user.generationsLimit = finalLimit;
    user.generationsUsed = 0; // reset usage on new plan
    user.brandVoicesLimit = finalPlan === 'starter' ? 10 : finalPlan === 'growth' ? 30 : finalPlan === 'agency' ? 100 : 10;
    user.isTrial = false;
    user.scheduledDowngrade = false;
    user.subscriptionCancelledAt = null;
    user.razorpayPaymentId = razorpayPaymentId;
    user.razorpaySubscriptionId = razorpaySubscriptionId;
    user.currentPeriodEnd = periodEnd;

    await user.save();
    console.log(`[RazorpayVerify] ✅ Plan updated to ${finalPlan} for user ${req.user._id}`);

    res.status(200).json({ success: true, plan: finalPlan });
  } catch (error) {
    console.error('[RazorpayVerify] Error:', error.message);
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
      .update(req.rawBody)
      .digest('hex');

    const expectedSigBuf = Buffer.from(expectedSig, 'utf8');
    const incomingSigBuf = Buffer.from(signature, 'utf8');

    if (expectedSigBuf.length !== incomingSigBuf.length || !crypto.timingSafeEqual(expectedSigBuf, incomingSigBuf)) {
      console.error('❌ Razorpay Webhook: Signature mismatch — possible spoofed request');
      return res.status(401).json({ error: 'Signature mismatch' });
    }

    const { event, payload } = JSON.parse(req.rawBody);
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
          try {
            await sendCancellationConfirmation(user.email, user.name, {
              planName: user.plan,
              accessUntil: user.currentPeriodEnd
            });
          } catch (emailErr) {
            console.error('[RazorpayWebhook] Cancellation email failed:', emailErr.message);
          }
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
            await sendDowngradeNotification(user.email, user.name, { 
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
            // Record Transaction
            await Transaction.findOneAndUpdate(
              { paymentId: payment.id },
              {
                userId: user._id,
                amount: payment.amount / 100,
                currency: payment.currency || 'INR',
                plan: user.plan,
                status: 'Paid',
                paymentProvider: 'razorpay',
                paymentId: payment.id,
                subscriptionId: payment.subscription_id,
                date: new Date()
              },
              { upsert: true, new: true }
            );

            const { sendPaymentInvoice } = require('../services/email.service');
            await sendPaymentInvoice(
              user.email, 
              user.name, 
              user.plan, 
              (payment.amount / 100).toFixed(2),
              'INR'
            );
          } catch (emailErr) {
            console.error('[RazorpayWebhook] Invoice/Transaction processing failed:', emailErr.message);
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

// TEMPORARY DEBUG ROUTE
router.get('/debug-keys', (req, res) => {
  res.json({
    KEY_ID: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : 'MISSING',
    SECRET_EXISTS: !!process.env.RAZORPAY_KEY_SECRET,
    SECRET_LENGTH: process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0,
    WEBHOOK_EXISTS: !!process.env.RAZORPAY_WEBHOOK_SECRET
  });
});

module.exports = router;
