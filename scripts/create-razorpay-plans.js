const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const plans = [
  // ── MONTHLY ────────────────────────────────────────────────────
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Starter Monthly',
      amount: 819900, // ₹8,199 in paise
      currency: 'INR',
      description: '300 Generations/mo | 10 Brand Voices',
    },
  },
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Growth Monthly',
      amount: 1639900, // ₹16,399 in paise
      currency: 'INR',
      description: '1000 Generations/mo | 30 Brand Voices',
    },
  },
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Agency Monthly',
      amount: 3279900, // ₹32,799 in paise
      currency: 'INR',
      description: '3000 Generations/mo | 100 Brand Voices',
    },
  },

  // ── ANNUAL ─────────────────────────────────────────────────────
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Starter Annual',
      amount: 8854900, // ₹88,549 in paise
      currency: 'INR',
      description: '300 Generations/mo | 10 Brand Voices | Annual',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Growth Annual',
      amount: 17710900, // ₹1,77,109 in paise
      currency: 'INR',
      description: '1000 Generations/mo | 30 Brand Voices | Annual',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Agency Annual',
      amount: 35422900, // ₹3,54,229 in paise
      currency: 'INR',
      description: '3000 Generations/mo | 100 Brand Voices | Annual',
    },
  },
];

async function createPlans() {
  console.log('🚀 Creating Razorpay Plans...\n');
  const results = {};

  for (const plan of plans) {
    try {
      const response = await razorpay.plans.create(plan);
      console.log(`✅ ${plan.item.name}: ${response.id}`);
      results[plan.item.name] = response.id;
    } catch (error) {
      console.error(`❌ Error creating ${plan.item.name}:`, error.error?.description || error.message);
    }
  }

  console.log('\n📋 Copy these to your .env:');
  console.log(`RAZORPAY_STARTER_PLAN_ID=${results['Copygen Starter Monthly'] || ''}`);
  console.log(`RAZORPAY_GROWTH_PLAN_ID=${results['Copygen Growth Monthly'] || ''}`);
  console.log(`RAZORPAY_AGENCY_PLAN_ID=${results['Copygen Agency Monthly'] || ''}`);
  console.log(`RAZORPAY_STARTER_ANNUAL_PLAN_ID=${results['Copygen Starter Annual'] || ''}`);
  console.log(`RAZORPAY_GROWTH_ANNUAL_PLAN_ID=${results['Copygen Growth Annual'] || ''}`);
  console.log(`RAZORPAY_AGENCY_ANNUAL_PLAN_ID=${results['Copygen Agency Annual'] || ''}`);
}

createPlans();


