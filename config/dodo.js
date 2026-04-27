const { DodoPayments } = require('dodopayments');

/**
 * Dodo Payments Client Configuration
 * Initializes the client using the DODO_API_KEY environment variable.
 * If key is missing, exports null — Dodo routes will return a 503 until configured.
 */

const apiKey = process.env.DODO_API_KEY;

if (!apiKey) {
  console.warn('⚠️  DODO_API_KEY is not set. International (Dodo) payments are disabled until configured.');
  module.exports = null;
} else {
  // Auto-detect environment based on key prefix (Test keys start with Dvu_)
  const environment = apiKey.startsWith('Dvu_') ? 'test_mode' : 'live_mode';
  
  const dodo = new DodoPayments({ 
    bearerToken: apiKey,
    environment: environment
  });
  console.log(`✅ Dodo Payments client initialized successfully in ${environment}`);
  module.exports = dodo;
}



