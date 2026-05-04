const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { runMonthlyReset } = require('../jobs/monthlyReset');

const router = express.Router();

/**
 * POST /api/admin/reset-usage
 * Triggers the monthly generation reset. Restricted to Admins only.
 */
router.post('/reset-usage', auth, requireRole(['admin']), async (req, res) => {
  try {
    const count = await runMonthlyReset();
    res.status(200).json({ 
      success: true, 
      message: `Manual reset triggered successfully. ${count} users affected.` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset usage', details: error.message });
  }
});

module.exports = router;
