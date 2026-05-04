const router = require('express').Router();
const auth = require('../middleware/auth');
const { getUrl, callback } = require('../controllers/googleAuthController');

/**
 * GET /api/google/auth-url
 * Protected: Returns the Google OAuth2 consent URL.
 */
router.get('/auth-url', auth, getUrl);

/**
 * GET /api/google/callback
 * Public: Handles the Google OAuth2 callback.
 * Google redirects here with ?code=...&state=userId
 */
router.get('/callback', callback);

module.exports = router;
