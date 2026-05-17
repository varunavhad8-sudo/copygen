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
const sendPaymentInvoice = async (email, name, planName, amount, currency = 'INR') => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  const symbol = currency === 'INR' ? '₹' : '$';

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
                <td style="text-align: right;">${symbol}${amount}</td>
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
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

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

/**
 * Get started nudge (day 1, no generation yet)
 */
const sendGetStartedNudge = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Have you tried Copygen yet?',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Ready to scale your agency, ${name}?</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            We noticed you haven't created your first client profile yet. Building your Agency OS starts with Brand Memory — once Copygen learns your client's voice, generating high-converting content takes seconds.
          </p>
          <div style="padding: 20px; background-color: #F9F9F9; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 0; color: #4A4A4A; font-weight: bold;">Step 1: Create a Client</p>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Add a website URL or existing content to build their unique voice profile.</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Create First Client
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] GetStartedNudge error:', err);
    return { success: false, error: err };
  }
};

/**
 * Access expiry reminder (3 days before period ends)
 */
const sendAccessExpiryReminder = async (email, name, { planName, accessUntil }) => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  try {
    const accessDate = new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Copygen access expires in 3 days',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Access expiring soon</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, your <strong>${planName}</strong> plan is set to expire on <strong>${accessDate}</strong>.
          </p>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            To ensure uninterrupted access to your Brand Memory profiles and unlimited generations, you can resubscribe now.
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Resubscribe Now
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] AccessExpiryReminder error:', err);
    return { success: false, error: err };
  }
};

/**
 * Plan downgraded to free
 */
const sendDowngradeNotification = async (email, name, { previousPlan }) => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Copygen account has been downgraded',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Account Downgraded</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, your subscription has ended and your account has been moved to the <strong>Free Tier</strong>.
          </p>
          <div style="padding: 20px; background-color: #F9F9F9; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 0; color: #4A4A4A; font-weight: bold;">Free Tier Limits:</p>
            <ul style="color: #666; font-size: 14px; margin-top: 10px;">
              <li>10 Generations total (lifetime free tier)</li>
              <li>1 Client / Brand Voice profile</li>
            </ul>
          </div>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Your existing Brand Memory data is safe, but you'll need to upgrade to generate more content or add more clients.
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
            View Plans
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] DowngradeNotification error:', err);
    return { success: false, error: err };
  }
};

/**
 * Winback (7 days after downgrade)
 */
const sendWinbackEmail = async (email, name, { previousPlan }) => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'We miss you at Copygen',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Scaling is easier with Copygen</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, we noticed you haven't used Copygen as much lately. Remember how much time you saved on your <strong>${previousPlan}</strong> plan?
          </p>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            We'd love to help you get back to 10x content production. Come back and see what's new in the dashboard!
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Return to Copygen
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] WinbackEmail error:', err);
    return { success: false, error: err };
  }
};

/**
 * 80% generation limit warning
 */
const sendGenerationLimitWarning = async (email, name, { used, limit, planName }) => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You've used 80% of your Copygen generations",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Running low on generations</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, you've used <strong>${used}</strong> out of your <strong>${limit}</strong> monthly generations on the <strong>${planName}</strong> plan.
          </p>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            To avoid any disruption to your workflow, you can upgrade your plan for more capacity.
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Upgrade Plan
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] GenerationLimitWarning error:', err);
    return { success: false, error: err };
  }
};

/**
 * 100% limit hit
 */
const sendGenerationLimitExhausted = async (email, name, { planName }) => {
  // Check bounce flag before sending
  const userRecord = await User.findOne({ email });
  if (userRecord?.emailBounced) {
    console.warn(`[EmailService] Skipping email to bounced address: ${email}`);
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You've hit your Copygen generation limit",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Generation limit reached</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, you've reached your generation limit for this month on your <strong>${planName}</strong> plan.
          </p>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Generations will reset at the start of your next billing cycle, or you can upgrade now to continue generating high-quality copy immediately.
          </p>
          <a href="${process.env.CLIENT_URL || 'https://copygen.in'}/app/settings" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
            Upgrade for Unlimited
          </a>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] GenerationLimitExhausted error:', err);
    return { success: false, error: err };
  }
};

/**
 * Password reset
 */
const sendPasswordReset = async (email, name, { resetLink }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Copygen password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, we received a request to reset your Copygen password. Click the button below to choose a new password:
          </p>
          <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #666;">
            <strong>Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] PasswordReset error:', err);
    return { success: false, error: err };
  }
};

/**
 * Email verification
 */
const sendEmailVerification = async (email, name, { verificationLink }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your Copygen email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Confirm your email address</h2>
          <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
            Hi ${name}, thanks for joining Copygen! Please verify your email address to secure your account and start generating content.
          </p>
          <a href="${verificationLink}" style="display: inline-block; padding: 14px 28px; background-color: #1A1A1A; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Verify Email
          </a>
          <p style="font-size: 14px; color: #666;">
            If the button above doesn't work, you can copy and paste this link into your browser:<br />
            <span style="color: #0066CC;">${verificationLink}</span>
          </p>
        </div>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    console.error('[EmailService] EmailVerification error:', err);
    return { success: false, error: err };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPaymentInvoice,
  sendCancellationConfirmation,
  sendGetStartedNudge,
  sendAccessExpiryReminder,
  sendDowngradeNotification,
  sendWinbackEmail,
  sendGenerationLimitWarning,
  sendGenerationLimitExhausted,
  sendPasswordReset,
  sendEmailVerification,
  handleEmailBounce
};
