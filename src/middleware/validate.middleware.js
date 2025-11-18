// src/middleware/validate.middleware.js (MODIFIED)
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // FIX: Log the actual validation errors on the server console
    console.error('❌ VALIDATION FAILED on POST /reviews:', errors.array()); 

    return res.status(400).json({
      success: false,
      message: 'Validation failed', // Explicit message for the client
      errors: errors.array().map(err => ({ message: err.msg })),
    });
  }

  next();
};