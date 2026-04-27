const PERSONAL_EMAIL_DOMAINS = [
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

const ALLOWED_PERSONAL_EMAILS = [
  'varunavhad8@gmail.com',
  'studrycontact@gmail.com',
  'varunavhad15@gmail.com',
  'manishagorakhnathavhad@gmail.com'
];

const isWorkEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const domain = normalizedEmail.split('@')[1];

  // 1. Check if it's explicitly allowed in our whitelist
  if (ALLOWED_PERSONAL_EMAILS.some(e => e.toLowerCase() === normalizedEmail)) {
    return true;
  }

  // 2. Check if it's a common personal domain
  if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    return false;
  }

  // 3. Otherwise, assume it's a work/business email
  return true;
};

module.exports = { isWorkEmail };


