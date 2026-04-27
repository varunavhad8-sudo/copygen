const router = require('express').Router();
const auth = require('../middleware/auth');
const { getSummary, getVolume, getBreakdown } = 
  require('../controllers/analyticsController');

router.get('/summary', auth, getSummary);
router.get('/volume', auth, getVolume);
router.get('/breakdown', auth, getBreakdown);

module.exports = router;


