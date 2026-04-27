const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { 
  createDodoSubscription, 
  cancelDodoSubscription, 
  getDodoSubscriptionStatus 
} = require('../services/dodo.service');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * ROUTE 1: Create subscription checkout session
 * POST /api/dodo/subscribe
 */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planKey } = req.body;
    
    // Validate planKey
    const validPlans = ['starter', 'growth', 'agency'];
    if (!validPlans.includes(planKey)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const { paymentLink, subscriptionId } = await createDodoSubscription(req.user._id, planKey);
    
    res.status(200).json({ paymentLink, subscriptionId });
  } catch (error) {
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

    // Capture raw body (Assumes express.raw middleware is used for this route in index.js)
    const rawBody = req.rawBody || (req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body)));

    // Compute expected HMAC SHA256 signature
    const signedPayload = `${webhookId}.${timestamp}.${rawBody.toString()}`;
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
    const event = JSON.parse(rawBody.toString());
    const { type, data } = event;

    console.log(`Dodo Webhook received: ${type}`);

    switch (type) {
      case 'subscription.active': {
        const dodoSubscriptionId = data.subscription_id;
        const productId = data.product_id;
        
        // Map product ID back to plan name
        let plan = 'free';
        let generationsLimit = 10;
        
        if (productId === process.env.DODO_STARTER_PRODUCT_ID) {
          plan = 'starter';
          generationsLimit = 100;
        } else if (productId === process.env.DODO_GROWTH_PRODUCT_ID) {
          plan = 'growth';
          generationsLimit = 300;
        } else if (productId === process.env.DODO_AGENCY_PRODUCT_ID) {
          plan = 'agency';
          generationsLimit = 1000;
        }

        const user = await User.findOneAndUpdate(
          { dodoSubscriptionId },
          { 
            plan, 
            generationsLimit, 
            planType: 'dodo',
            currentPeriodEnd: new Date(data.current_period_end)
          },
          { new: true }
        );

        // Send Invoice Email (Non-blocking)
        if (user) {
          const { sendPaymentInvoice } = require('../services/email.service');
          sendPaymentInvoice(user.email, user.name || 'valued customer', plan, data.amount || 0);
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.failed': {
        const user = await User.findOneAndUpdate(
          { dodoSubscriptionId: data.subscription_id },
          { 
            scheduledDowngrade: true,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined
          }
        );
        
        if (user && type === 'subscription.cancelled') {
          const { sendCancellationConfirmation } = require('../services/email.service');
          sendCancellationConfirmation(user.email, user.name, {
            planName: user.plan,
            accessUntil: data.current_period_end ? new Date(data.current_period_end) : user.currentPeriodEnd
          });
        }
        break;
      }

      case 'payment.succeeded': {
        console.log('Dodo payment succeeded:', event);
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


