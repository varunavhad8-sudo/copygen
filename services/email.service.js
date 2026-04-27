const { Resend } = require('resend');
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Copygen <hello@copygen.in>';
const SUPPORT_EMAIL = 'support@copygen.in';

/**
 * Send a welcome email to a new user
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Copygen!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1A1A1A;">Welcome to the Agency OS, ${name}!</h1>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            We're thrilled to have you on board. Copygen is designed to help your agency scale by memorizing your clients' voices and generating content that actually converts.
          </p>
          <div style="padding: 20px; background-color: #F9F9F9; border-radius: 12px; margin: 30px 0;">
            <h3 style="margin-top: 0;">Getting Started:</h3>
            <ul style="color: #4A4A4A;">
              <li>Create your first Client profile.</li>
              <li>Add a website URL to build their Brand Memory.</li>
              <li>Start generating blogs, socials, and ad copy in seconds.</li>
            </ul>
          </div>
          <a href="${process.env.CLIENT_URL}/app" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go to Dashboard
          </a>
          <p style="margin-top: 40px; font-size: 12px; color: #999;">
            If you have any questions, just reply to this email. We're here to help!
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[EmailService] Unexpected error:', err);
    return { success: false, error: err };
  }
};

/**
 * Send a payment success/invoice email
 */
const sendPaymentInvoice = async (email, name, planName, amount) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Copygen invoice - ${planName} Plan`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Payment Received</h2>
          <p style="font-size: 16px; color: #4A4A4A;">
            Hi ${name}, thank you for your subscription to the <strong>${planName}</strong> plan.
          </p>
          <div style="border: 1px solid #EEE; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Plan:</strong></td>
                <td style="text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td><strong>Amount Paid:</strong></td>
                <td style="text-align: right;">₹${amount}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong></td>
                <td style="text-align: right; color: green;">Paid</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #666;">
            Your account has been upgraded. You can now access all features included in your plan.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending invoice:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[EmailService] Unexpected error:', err);
    return { success: false, error: err };
  }
};

/**
 * Send cancellation confirmation email
 */
const sendCancellationConfirmation = async (email, name, { planName, accessUntil }) => {
  try {
    const accessDate = accessUntil ? new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the end of your billing period';
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Copygen subscription has been cancelled`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Subscription Cancelled</h2>
          <p style="font-size: 16px; color: #4A4A4A;">
            Hi ${name || 'there'},
          </p>
          <p style="font-size: 16px; color: #4A4A4A;">
            Your cancellation for the <strong>${planName}</strong> plan has been processed. We're sorry to see you go!
          </p>
          <div style="border: 1px solid #EEE; padding: 20px; border-radius: 12px; margin: 20px 0; background-color: #F9F9F9;">
            <p style="margin: 0; color: #4A4A4A;">
              <strong>Access Until:</strong> ${accessDate}
            </p>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">
              You will continue to have full access to your plan features until this date. After that, your account will downgrade to the free tier.
            </p>
          </div>
          <p style="font-size: 16px; color: #4A4A4A; margin-top: 30px;">
            Changed your mind? You can always resubscribe from your workspace.
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            Resubscribe
          </a>
        </div>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending cancellation confirmation:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[EmailService] Unexpected error:', err);
    return { success: false, error: err };
  }
};

/**
 * Handle email bounce / complaint events from Resend webhooks.
 * Call this from the Resend webhook route handler.
 *
 * When a bounce is detected:
 * 1. Logs the event in the database on the user's record
 * 2. Flags the account as having an invalid email
 * 3. Sends an internal alert to support@copygen.in
 * 4. Never retries sending to the bounced address
 */
const handleEmailBounce = async ({ type, email: bouncedEmail, reason }) => {
  try {
    console.warn(`[EmailService] ${type} event for: ${bouncedEmail} — reason: ${reason || 'unknown'}`);

    // 1. Flag user as having an invalid/bounced email in the database
    const result = await User.findOneAndUpdate(
      { email: bouncedEmail },
      {
        $set: {
          emailBounced: true,
          emailBouncedAt: new Date(),
          emailBounceType: type,         // 'bounce' or 'complaint'
          emailBounceReason: reason || 'Resend webhook event'
        }
      },
      { new: true }
    );

    if (result) {
      console.warn(`[EmailService] User ${result._id} flagged for bounced email: ${bouncedEmail}`);
    } else {
      console.warn(`[EmailService] No user found for bounced email: ${bouncedEmail}`);
    }

    // 2. Send internal alert to support team (do NOT send to the bounced address)
    const alertSent = await resend.emails.send({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `[Alert] Email ${type} — ${bouncedEmail}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #CC0000;">Email ${type === 'complaint' ? 'Complaint' : 'Bounce'} Detected</h2>
          <p><strong>Email:</strong> ${bouncedEmail}</p>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Reason:</strong> ${reason || 'Not provided by Resend'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Action taken:</strong> Account flagged as emailBounced=true. No further emails will be sent to this address.</p>
          <hr />
          <p style="font-size: 12px; color: #999;">This is an automated internal alert from the Copygen email system.</p>
        </div>
      `
    });

    if (alertSent.error) {
      console.error('[EmailService] Failed to send bounce alert to support:', alertSent.error);
    }

    return { success: true };
  } catch (err) {
    console.error('[EmailService] Bounce handler error:', err);
    return { success: false, error: err };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPaymentInvoice,
  sendCancellationConfirmation,
  handleEmailBounce
};
