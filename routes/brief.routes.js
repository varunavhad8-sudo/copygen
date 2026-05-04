const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const usageLimiter = require('../middleware/usageLimiter');
const { generate } = require('../controllers/briefController');

// Validation middleware
const validateBrief = [
  body('briefText').isLength({ min: 10 }).withMessage('Brief text must be at least 10 characters long'),
  body('contentType').notEmpty().withMessage('Content type is required'),
  body('platform').notEmpty().withMessage('Platform is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/', auth, validateBrief, usageLimiter, generate);
router.post('/generate', auth, validateBrief, usageLimiter, generate);

module.exports = router;


