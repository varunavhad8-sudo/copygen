const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, getMe, patchProfile, deleteAccount, completeOnboarding, getOnboardingStatus } = require('../controllers/authController');

router.post('/register', register);
router.get('/me', auth, getMe);
router.patch('/profile', auth, patchProfile);
router.get('/onboarding/status', auth, getOnboardingStatus);
router.post('/onboarding/complete', auth, completeOnboarding);
router.delete('/account', auth, deleteAccount);

module.exports = router;


