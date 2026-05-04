const router = require('express').Router();
const auth = require('../middleware/auth');
const { check } = require('../controllers/factCheckerController');

// All fact-checking routes are protected by auth middleware
router.post('/check', auth, check);

module.exports = router;
