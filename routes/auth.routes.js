const router = require('express').Router();
const auth = require('../middleware/auth');
const { 
  register, 
  getMe, 
  patchProfile, 
  getNotifications, 
  updateNotifications, 
  getApiKey, 
  regenerateApiKey, 
  deleteAccount, 
  completeOnboarding, 
  getOnboardingStatus 
} = require('../controllers/authController');

router.post('/register', register);
router.get('/me', auth, getMe);
router.patch('/profile', auth, patchProfile);
router.put('/profile', auth, patchProfile); 

// Notifications
router.get('/notifications', auth, getNotifications);
router.put('/notifications', auth, updateNotifications);

// API Key (Even if UI is removed, backend should support to avoid 404s if called)
router.get('/api-key', auth, getApiKey);
router.post('/api-key/regenerate', auth, regenerateApiKey);

router.get('/onboarding/status', auth, getOnboardingStatus);
router.post('/onboarding/complete', auth, completeOnboarding);
router.delete('/account', auth, deleteAccount);

module.exports = router;
