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
  generateReport,
  getTopClients
} = require('../controllers/analyticsController');

router.get('/summary', auth, getSummary);
router.get('/overview', auth, getSummary); // Alias
router.get('/volume', auth, getVolume);
router.get('/activity', auth, getVolume); // Alias
router.get('/breakdown', auth, getBreakdown);
router.get('/formats', auth, getBreakdown); // Alias
router.get('/top-clients', auth, getTopClients);
router.get('/clients', auth, getTopClients); // Alias
router.get('/recent', auth, (req, res, next) => {
  // Simple proxy to get recent outputs for the activity feed
  const { getRecent } = require('../controllers/outputController');
  return getRecent(req, res, next);
});

// Performance Analytics
router.get('/search-console', auth, getSearchConsoleData);
router.get('/keywords', auth, getKeywords);
router.get('/ga4', auth, getGA4Data);
router.get('/patterns', auth, getPatterns);
router.post('/report', auth, generateReport);

module.exports = router;


