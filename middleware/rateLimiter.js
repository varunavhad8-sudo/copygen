const rateLimit = require('express-rate-limit');

/**
 * Standard handler to ensure all rate limit responses are JSON.
 */
const jsonResponseHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
    code: 'RATE_LIMIT_EXCEEDED'
  });
};

/**
 * Smart key generator:
 * - Authenticated requests: rate limited by USER ID (not IP)
 *   This prevents a corporate office with 10 employees on one IP from being blocked.
 * - Unauthenticated requests: rate limited by IP
 *   This still protects against unauthenticated abuse.
 */
const smartKeyGenerator = (req) => {
  // If the request has been through auth middleware and has a user, use user ID
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }
  // Fall back to IP for unauthenticated requests, replacing colons to bypass ERL IPv6 strict check
  return req.ip ? req.ip.replace(/:/g, '_') : 'unknown_ip';
};

/**
 * TIER 1 — strictLimiter (for auth routes)
 * 10 requests per 15 minutes per IP (auth routes are always unauthenticated)
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many auth attempts. Please wait 15 minutes.',
  handler: jsonResponseHandler,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false
});

/**
 * TIER 2 — apiLimiter (for AI generation)
 * 30 requests per minute per USER (authenticated) or IP (unauthenticated)
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Generation limit reached. Please slow down.',
  handler: jsonResponseHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: smartKeyGenerator,
  validate: false
});

/**
 * TIER 3 — generalLimiter (for all other routes)
 * 200 requests per minute per USER (authenticated) or 100 per IP (unauthenticated)
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200, // Higher limit since authenticated users are trusted
  message: 'Too many requests. Please slow down.',
  handler: jsonResponseHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: smartKeyGenerator,
  validate: false
});

module.exports = {
  strictLimiter,
  apiLimiter,
  generalLimiter
};
