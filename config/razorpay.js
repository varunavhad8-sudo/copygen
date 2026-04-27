const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

// Strict validation of environment variables
if (!key_id || !key_secret) {
  const missing = [];
  if (!key_id) missing.push('RAZORPAY_KEY_ID');
  if (!key_secret) missing.push('RAZORPAY_KEY_SECRET');
  
  throw new Error(
    `[Razorpay Config] Missing environment variables: ${missing.join(', ')}. ` +
    `Please check your server/.env file.`
  );
}

const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

console.log('✅ Razorpay client initialized successfully');

module.exports = razorpay;



