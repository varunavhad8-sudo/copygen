/**
 * Middleware to restrict access to specific roles.
 * Must be placed AFTER the auth middleware.
 * 
 * @param {Array<string>} roles - Array of allowed roles (e.g., ['admin'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`[Security] Unauthorized access attempt by ${req.user.email} (Role: ${req.user.role}) to ${req.originalUrl}`);
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to perform this action' 
      });
    }

    next();
  };
};

module.exports = { requireRole };
