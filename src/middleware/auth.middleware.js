const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

/**
 * Verify JWT token and attach user payload to `req.user`
 */
exports.requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains { userId, role }
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

/**
 * Check if the user has a specific role
 */
exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return error(res, 'Access forbidden: Insufficient permissions', 403);
  }
  next();
};

/**
 * Check if the user has any role from allowed list
 */
exports.requireAnyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return error(res, 'Access forbidden: Insufficient permissions', 403);
  }
  next();
};
