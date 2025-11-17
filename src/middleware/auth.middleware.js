const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

exports.requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return error(res, 'Access forbidden: Insufficient permissions', 403);
  }
  next();
};

exports.requireAnyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return error(res, 'Access forbidden: Insufficient permissions', 403);
  }
  next();
};
