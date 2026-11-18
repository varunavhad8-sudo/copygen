/**
 * List of common personal email providers to block for manual signup.
 */
export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'me.com',
  'live.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'yandex.com',
  'zoho.com',
  'gmx.com'
];

export const ALLOWED_PERSONAL_EMAILS = [
  'varunavhad8@gmail.com',
  'studrycontact@gmail.com',
  'varunavhad15@gmail.com',
  'manishagorakhnathavhad@gmail.com'
];

/**
 * Checks if an email is a "work email" (not from a personal provider)
 * or is in the explicitly allowed whitelist.
 * @param {string} email 
 * @returns {boolean}
 */
export const isWorkEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  return true; // Relaxed: Allow all email providers (Gmail, Yahoo, etc.)
};



