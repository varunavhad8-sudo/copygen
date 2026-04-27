const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Annual prices = monthly × 12 × 0.90 (10% discount)
const annualPlans = [
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Starter Annual (10% off)',
      amount: 3238900, // ₹32,389 in paise
      currency: 'INR',
      description: '100 Generations/mo | 10 Brand Voices | Save 10%',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Growth Annual (10% off)',
      amount: 6478900, // ₹64,789 in paise
      currency: 'INR',
      description: '400 Generations/mo | 150 Brand Voices | Save 10%',
    },
  },
  {
    period: 'yearly',
    interval: 1,
    item: {
      name: 'Copygen Agency Annual (10% off)',
      amount: 12958900, // ₹1,29,589 in paise
      currency: 'INR',
      description: '1000 Generations/mo | Unlimited Brand Voices | Save 10%',
    },
  },
];

async function createAnnualPlans() {
  console.log('🚀 Creating Annual Plans with 10% discount...\n');
  const results = {};

  for (const plan of annualPlans) {
    try {
      const response = await razorpay.plans.create(plan);
      console.log(`✅ ${plan.item.name}: ${response.id}`);
      results[plan.item.name] = response.id;
    } catch (error) {
      console.error(`❌ ${plan.item.name}:`, error.error?.description || error.message);
    }
  }

  console.log('\n📋 Update these in your .env:');
  console.log(`RAZORPAY_STARTER_ANNUAL_PLAN_ID=${results['Copygen Starter Annual (10% off)'] || ''}`);
  console.log(`RAZORPAY_GROWTH_ANNUAL_PLAN_ID=${results['Copygen Growth Annual (10% off)'] || ''}`);
  console.log(`RAZORPAY_AGENCY_ANNUAL_PLAN_ID=${results['Copygen Agency Annual (10% off)'] || ''}`);
}

createAnnualPlans();


