const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkBrandVoiceLimit } = require('../middleware/usageLimiter');
const { getByClient, save, remove } = require('../controllers/brandController');

router.get('/:clientId', auth, getByClient);

// checkBrandVoiceLimit only runs on the save (POST) route.
// GET and DELETE are unrestricted — users must always be able to read and
// delete their own profiles.
router.post('/', auth, checkBrandVoiceLimit, save);

router.delete('/:clientId', auth, remove);

module.exports = router;
