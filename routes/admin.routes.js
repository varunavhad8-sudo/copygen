const express = require('express');
const { runMonthlyReset } = require('../jobs/monthlyReset');

const router = express.Router();

/**
 * Middleware to check for the admin secret
 */
const requireAdminSecret = (req, res, next) => {
  const secret = req.headers['admin_secret'] || req.headers['admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid or missing Admin Secret' });
  }
  next();
};

/**
 * POST /api/admin/reset-usage
 * Triggers the monthly generation reset. Restricted to Admins only.
 */
router.post('/reset-usage', requireAdminSecret, async (req, res) => {
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
