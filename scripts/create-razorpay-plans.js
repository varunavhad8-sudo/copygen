const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const plans = [
  // ── TEST ───────────────────────────────────────────────────────
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Starter Test Plan',
      amount: 100, // 100 paise = 1 rupee
      currency: 'INR',
      description: 'Starter plan - 1 rupee test'
    }
  },

  // ── MONTHLY ────────────────────────────────────────────────────
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Starter Monthly',
      amount: 299900, // ₹2,999 in paise
      currency: 'INR',
      description: '100 Generations/mo | 10 Brand Voices',
    },
  },
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Growth Monthly',
      amount: 599900, // ₹5,999 in paise
      currency: 'INR',
      description: '400 Generations/mo | 150 Brand Voices',
    },
  },
  {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Copygen Agency Monthly',
      amount: 1199900, // ₹11,999 in paise
      currency: 'INR',
      description: '1000 Generations/mo | Unlimited Brand Voices',
    },
  },

  // ── ANNUAL ─────────────────────────────────────────────────────
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Starter Annual',
      amount: 2999900, // ₹29,999 in paise
      currency: 'INR',
      description: '100 Generations/mo | 10 Brand Voices | 2 Months Free',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Growth Annual',
      amount: 5999900, // ₹59,999 in paise
      currency: 'INR',
      description: '400 Generations/mo | 150 Brand Voices | 2 Months Free',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Agency Annual',
      amount: 11999900, // ₹1,19,999 in paise
      currency: 'INR',
      description: '1000 Generations/mo | Unlimited Brand Voices | 2 Months Free',
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


