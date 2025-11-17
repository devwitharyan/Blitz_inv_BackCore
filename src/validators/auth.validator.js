const { body } = require('express-validator');

exports.register = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').notEmpty().withMessage('Mobile number is required'),
  body('role').isIn(['customer', 'provider', 'admin']).withMessage('Role must be one of customer, provider, or admin'),
];

exports.login = [
  body('emailOrMobile').notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
