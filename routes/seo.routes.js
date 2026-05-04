const router = require('express').Router();
const auth = require('../middleware/auth');
const usageLimiter = require('../middleware/usageLimiter');
const { generate } = require('../controllers/seoController');

router.post('/', auth, usageLimiter, generate);
router.post('/generate', auth, usageLimiter, generate);

module.exports = router;
