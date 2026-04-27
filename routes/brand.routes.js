const router = require('express').Router();
const auth = require('../middleware/auth');
const { getByClient, save, remove } = require('../controllers/brandController');

router.get('/:clientId', auth, getByClient);
router.post('/', auth, save);
router.delete('/:clientId', auth, remove);

module.exports = router;
