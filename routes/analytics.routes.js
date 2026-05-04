const router = require('express').Router();
const auth = require('../middleware/auth');
const { 
  getSummary, 
  getVolume, 
  getBreakdown,
  getSearchConsoleData,
  getKeywords,
  getGA4Data,
  getPatterns,
  generateReport
} = require('../controllers/analyticsController');

router.get('/summary', auth, getSummary);
router.get('/volume', auth, getVolume);
router.get('/breakdown', auth, getBreakdown);

// Performance Analytics
router.get('/search-console', auth, getSearchConsoleData);
router.get('/keywords', auth, getKeywords);
router.get('/ga4', auth, getGA4Data);
router.get('/patterns', auth, getPatterns);
router.post('/report', auth, generateReport);

module.exports = router;


