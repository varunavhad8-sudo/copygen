const { DodoPayments } = require('dodopayments');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.DODO_API_KEY;

async function main() {
    try {
      console.log(`--- Testing Environment: test_mode ---`);
      const dodo = new DodoPayments({
        bearerToken: apiKey,
        environment: 'test_mode'
      });

      const products = await dodo.products.list();
      console.log(`Success! Response structure:`, JSON.stringify(products, null, 2));
    } catch (error) {
      console.error(`Error:`, error.status, error.error || error.message);
    }
}

main();
