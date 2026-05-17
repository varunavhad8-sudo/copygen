const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { 
  createDodoSubscription, 
  cancelDodoSubscription, 
  getDodoSubscriptionStatus 
} = require('../services/dodo.service');
const auth = require('../middleware/auth');

const router = express.Router();
const { PLAN_LIMITS } = require('../config/plans');


/**
 * ROUTE 1: Create subscription checkout session
 * POST /api/dodo/subscribe
 */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planKey, isAnnual } = req.body;
    
    // Validate planKey
    const validPlans = ['starter', 'growth', 'agency'];
    if (!validPlans.includes(planKey)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const { paymentLink, subscriptionId } = await createDodoSubscription(req.user._id, planKey, isAnnual);
    
    res.status(200).json({ paymentLink, subscriptionId });
  } catch (error) {
    if (error.code === 'ACTIVE_SUBSCRIPTION') {
      return res.status(409).json({
        error: 'ACTIVE_SUBSCRIPTION',
        message: 'You already have an active subscription.',
        planType: error.planType || 'dodo'
      });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 2: Cancel subscription
 * POST /api/dodo/cancel
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    const result = await cancelDodoSubscription(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 3: Get subscription status
 * GET /api/dodo/status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const status = await getDodoSubscriptionStatus(req.user._id);
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ROUTE 4: Dodo Webhook (Unauthenticated)
 * POST /api/dodo/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    // 1. Signature Verification
    // Dodo uses 'webhook-signature', 'webhook-timestamp', and 'webhook-id'
    // Verification logic: HMAC SHA256(webhook_id + "." + webhook_timestamp + "." + raw_body, secret)
    const signature = req.headers['webhook-signature'];
    const timestamp = req.headers['webhook-timestamp'];
    const webhookId = req.headers['webhook-id'];
    const secret = process.env.DODO_WEBHOOK_SECRET;

    if (!signature || !timestamp || !webhookId || !secret) {
      return res.status(401).json({ error: 'Invalid signature headers' });
    }

    // CORRECT - rawBody is always guaranteed by middleware
    const rawBody = req.rawBody;
    if (!rawBody) {
      console.error('❌ No raw body available for Dodo webhook signature verification');
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Compute expected HMAC SHA256 signature
    const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // ── ACTUAL SIGNATURE COMPARISON (timingSafeEqual prevents timing attacks) ──
    // Dodo may send multiple signatures separated by spaces — check each one
    const incomingSignatures = signature.split(' ');
    const signatureMatched = incomingSignatures.some((sig) => {
      // Strip any "v1," prefix that Dodo prepends to signatures
      const rawSig = sig.includes(',') ? sig.split(',')[1] : sig;
      try {
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const incomingBuf = Buffer.from(rawSig, 'utf8');
        return (
          expectedBuf.length === incomingBuf.length &&
          crypto.timingSafeEqual(expectedBuf, incomingBuf)
        );
      } catch {
        return false;
      }
    });

    if (!signatureMatched) {
      console.error('❌ Dodo Webhook: Signature mismatch — rejecting request');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('✅ Dodo Webhook: Signature verified');

    // 2. Handle Event
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log(`Dodo Webhook received: ${type}`);

    switch (type) {
      case 'subscription.active': {
        const dodoSubscriptionId = data.subscription_id;
        const productId = data.product_id;
        
        // Map product ID back to plan name
        let plan = 'free';
        let generationsLimit = PLAN_LIMITS.free.generations;
        let brandVoicesLimit = PLAN_LIMITS.free.brandVoices;
        
        if (productId === process.env.DODO_STARTER_PRODUCT_ID || productId === process.env.DODO_STARTER_ANNUAL_PRODUCT_ID) {
          plan = 'starter';
          generationsLimit = PLAN_LIMITS.starter.generations;
          brandVoicesLimit = PLAN_LIMITS.starter.brandVoices;
        } else if (productId === process.env.DODO_GROWTH_PRODUCT_ID || productId === process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID) {
          plan = 'growth';
          generationsLimit = PLAN_LIMITS.growth.generations;
          brandVoicesLimit = PLAN_LIMITS.growth.brandVoices;
        } else if (productId === process.env.DODO_AGENCY_PRODUCT_ID || productId === process.env.DODO_AGENCY_ANNUAL_PRODUCT_ID) {
          plan = 'agency';
          generationsLimit = PLAN_LIMITS.agency.generations;
          brandVoicesLimit = PLAN_LIMITS.agency.brandVoices;
        }


        // CORRECT - look up by subscription ID first, then session ID, then email
        const user = await User.findOne({
          $or: [
            { dodoSubscriptionId: dodoSubscriptionId },
            { dodoCheckoutSessionId: data.payment_session_id || data.session_id },
            ...(data.customer?.email ? [{ email: data.customer.email }] : [])
          ]
        });

        if (user) {
          user.dodoSubscriptionId = dodoSubscriptionId; // Update session ID with real subscription ID
          user.dodoCheckoutSessionId = null; // Clear the temporary session reference
          user.previousPlan = user.plan;
          user.plan = plan;
          user.generationsLimit = generationsLimit;
          user.brandVoicesLimit = brandVoicesLimit;

          user.planType = 'dodo';
          user.currentPeriodEnd = new Date(data.current_period_end);
          await user.save();
        }

        // Send Invoice Email (Non-blocking)
        if (user) {
          const { sendPaymentInvoice } = require('../services/email.service');
          try {
            await sendPaymentInvoice(user.email, user.name || 'valued customer', plan, data.amount || 0, data.currency || 'USD');
          } catch (emailErr) {
            console.error('[DodoWebhook] Invoice email failed:', emailErr.message);
          }
        }
        break;
      }

      case 'subscription.cancelled': {
        const user = await User.findOneAndUpdate(
          { dodoSubscriptionId: data.subscription_id },
          { 
            scheduledDowngrade: true,
            subscriptionCancelledAt: new Date(),
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined
          },
          { new: true }
        );
        
        if (user) {
          const { sendCancellationConfirmation } = require('../services/email.service');
          try {
            await sendCancellationConfirmation(user.email, user.name, {
              planName: user.plan,
              accessUntil: data.current_period_end ? new Date(data.current_period_end) : user.currentPeriodEnd
            });
          } catch (emailErr) {
            console.error('[DodoWebhook] Cancellation email failed:', emailErr.message);
          }
        }
        break;
      }

      case 'subscription.failed': {
        const failedUser = await User.findOne({ dodoSubscriptionId: data.subscription_id });
        await User.findOneAndUpdate(
          { dodoSubscriptionId: data.subscription_id },
          { 
            plan: 'free',
            planType: 'free',
            generationsLimit: PLAN_LIMITS.free.generations,
            brandVoicesLimit: PLAN_LIMITS.free.brandVoices,
            scheduledDowngrade: false,
            previousPlan: failedUser?.plan || 'starter',
            dodoSubscriptionId: null
          }
        );
        break;
      }

      case 'subscription.expired':
      case 'subscription.completed': {
        const user = await User.findOne({ dodoSubscriptionId: data.subscription_id });
        if (user) {
          try {
            const { sendDowngradeNotification } = require('../services/email.service');
            await sendDowngradeNotification(user.email, user.name, { previousPlan: user.plan });
          } catch (emailErr) {
            console.error('[DodoWebhook] Downgrade email failed:', emailErr.message);
          }

          await User.findOneAndUpdate(
            { dodoSubscriptionId: data.subscription_id },
            {
              plan: 'free',
              planType: 'free',
              generationsLimit: PLAN_LIMITS.free.generations,
              brandVoicesLimit: PLAN_LIMITS.free.brandVoices,
              scheduledDowngrade: false,
              subscriptionCancelledAt: null,
              dodoSubscriptionId: null,
              currentPeriodEnd: null
            }
          );
        }
        break;
      }

      case 'payment.succeeded': {
        const paymentUser = await User.findOne({ dodoSubscriptionId: data.subscription_id });
        if (paymentUser) {
          try {
            // Record Transaction
            await Transaction.findOneAndUpdate(
              { paymentId: data.payment_id },
              {
                userId: paymentUser._id,
                amount: data.amount / 100,
                currency: data.currency || 'USD',
                plan: paymentUser.plan,
                status: 'Paid',
                paymentProvider: 'dodo',
                paymentId: data.payment_id,
                subscriptionId: data.subscription_id,
                date: new Date()
              },
              { upsert: true, new: true }
            );

            paymentUser.currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end) : paymentUser.currentPeriodEnd;
            await paymentUser.save();
            const { sendPaymentInvoice } = require('../services/email.service');
            await sendPaymentInvoice(
              paymentUser.email,
              paymentUser.name || 'valued customer',
              paymentUser.plan,
              data.amount ? (data.amount / 100).toFixed(2) : 0,
              data.currency || 'USD'
            );
          } catch (err) {
            console.error('[DodoWebhook] Transaction/Invoice failed:', err.message);
          }
        }
        break;
      }

      default:
        console.log('Unhandled Dodo event:', type);
    }

    // Always 200 to prevent retries
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook Error:', error.message);
    // Returning 200 even on processing error is safer for webhooks unless it's a transient failure
    res.status(200).json({ received: true, error: error.message });
  }
});

module.exports = router;


