const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handleEmailBounce } = require('../services/email.service');

/**
 * POST /api/webhooks/resend
 *
 * Handles Resend email events: bounce, complaint, delivered.
 *
 * Security: Resend signs every webhook with a sha256 HMAC.
 * We verify the signature using RESEND_WEBHOOK_SECRET from the Resend dashboard.
 *
 * Setup:
 * 1. Go to Resend → Webhooks → Add Endpoint → URL: https://api.copygen.in/api/webhooks/resend
 * 2. Select events: email.bounced, email.complained
 * 3. Copy the signing secret and set RESEND_WEBHOOK_SECRET in .env
 */
router.post('/resend', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['resend-signature'];
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  // ── Signature Verification ───────────────────────────────────────────────
  if (!secret) {
    console.error('[ResendWebhook] RESEND_WEBHOOK_SECRET not set — cannot verify signature');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!signature) {
    console.warn('[ResendWebhook] Missing resend-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  const rawBody = req.body; // Buffer (because express.raw is used)
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const sigBuffer = Buffer.from(`sha256=${expectedSig}`, 'utf8');
  const sigProvided = Buffer.from(signature, 'utf8');

  if (sigBuffer.length !== sigProvided.length || !crypto.timingSafeEqual(sigBuffer, sigProvided)) {
    console.warn('[ResendWebhook] Invalid signature — rejecting');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // ── Parse Event ──────────────────────────────────────────────────────────
  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { type, data } = event;
  const emailAddress = data?.email_id || data?.to?.[0];

  console.log(`[ResendWebhook] Event received: ${type} — ${emailAddress}`);

  // ── Handle Events ────────────────────────────────────────────────────────
  switch (type) {
    case 'email.bounced':
      await handleEmailBounce({
        type: 'bounce',
        email: emailAddress,
        reason: data?.bounce?.message || 'Hard bounce',
      });
      break;

    case 'email.complained':
      await handleEmailBounce({
        type: 'complaint',
        email: emailAddress,
        reason: 'Spam complaint reported via Resend',
      });
      break;

    case 'email.delivered':
      console.log(`[ResendWebhook] Email delivered to: ${emailAddress}`);
      break;

    default:
      console.log(`[ResendWebhook] Unhandled event type: ${type}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
