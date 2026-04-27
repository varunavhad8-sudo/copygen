const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.DODO_API_KEY;

async function main() {
  try {
    const urls = [
        'https://test.dodopayments.com/v1/products',
        'https://live.dodopayments.com/v1/products'
    ];

    for (const url of urls) {
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Body: ${text.substring(0, 100)}`);
    }

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

main();
