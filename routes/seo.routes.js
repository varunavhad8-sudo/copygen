const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkGenerationLimit } = require('../middleware/usageLimiter');
const { generate } = require('../controllers/seoController');

router.post('/', auth, checkGenerationLimit, generate);
router.post('/generate', auth, checkGenerationLimit, generate);

module.exports = router;
