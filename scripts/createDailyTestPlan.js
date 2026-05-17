const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error('❌ Error: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function createDailyTestPlan() {
  console.log('🚀 Connecting to Razorpay and creating Daily ₹1 Plan...');
  
  const options = {
    period: 'daily',
    interval: 7,
    item: {
      name: 'Daily Test Plan',
      amount: 100, // ₹1 in paise
      currency: 'INR',
      description: 'Development test plan - ₹1/day'
    },
    notes: {
      plan_type: 'test',
      created_by: 'setup_script'
    }
  };

  try {
    const response = await razorpay.plans.create(options);
    console.log('✅ Plan created successfully!');
    console.log('Full Response:', JSON.stringify(response, null, 2));
    console.log(`\nAdd this to your .env:\nRAZORPAY_DAILY_TEST_PLAN_ID=${response.id}`);
  } catch (error) {
    console.error('❌ Error creating Daily Test Plan:');
    console.error(error.error?.description || error.message || error);
  }
}

createDailyTestPlan();
