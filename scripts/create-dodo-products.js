const { DodoPayments } = require('dodopayments');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.DODO_API_KEY;

const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: 'test_mode'
});

async function createProduct(name, priceInCents) {
  try {
    console.log(`Creating product: ${name} ($${priceInCents/100})...`);
    const product = await dodo.products.create({
      name: name,
      description: `Copygen ${name} Subscription`,
      tax_category: 'saas',
      price: {
        type: 'recurring_price',
        currency: 'USD',
        price: priceInCents,
        discount: 0,
        payment_frequency_count: 1,
        payment_frequency_interval: 'Month', // Capitalized
        subscription_period_count: 1,
        subscription_period_interval: 'Month', // Capitalized
        purchasing_power_parity: false
      }
    });
    console.log(`✅ Success! ${name} ID: ${product.product_id}`);
    return product.product_id;
  } catch (error) {
    console.error(`❌ Error creating ${name}:`, error.status, JSON.stringify(error.error || error.message, null, 2));
    return null;
  }
}

async function main() {
  if (!apiKey) {
    console.error("DODO_API_KEY not found in .env");
    return;
  }

  const starterId = await createProduct("Starter", 9900);
  const growthId = await createProduct("Growth", 19900);
  const agencyId = await createProduct("Agency", 39900);

  console.log("\n--- COPY THESE TO YOUR .env FILE ---");
  console.log(`DODO_STARTER_PRODUCT_ID=${starterId || 'FAILED'}`);
  console.log(`DODO_GROWTH_PRODUCT_ID=${growthId || 'FAILED'}`);
  console.log(`DODO_AGENCY_PRODUCT_ID=${agencyId || 'FAILED'}`);
}

main();
