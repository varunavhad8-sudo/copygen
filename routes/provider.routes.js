const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getProviderSettings,
  saveProviderKey,
  deleteProviderKey,
  setActiveProvider
} = require('../controllers/providerController');

router.get('/', auth, getProviderSettings);
router.put('/active', auth, setActiveProvider);
router.put('/:provider', auth, saveProviderKey);
router.delete('/:provider', auth, deleteProviderKey);

module.exports = router;
