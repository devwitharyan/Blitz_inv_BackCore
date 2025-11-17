const { error } = require('../utils/response');

/**
 * Global error handler for unhandled exceptions
 */
module.exports = (err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  return error(res, 'Internal server error', 500);
};
