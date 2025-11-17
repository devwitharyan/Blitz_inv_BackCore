const { body } = require('express-validator');

exports.create = [
  body('bookingId').notEmpty().isUUID().withMessage('Valid bookingId is required'),
  body('amount').notEmpty().isFloat({ min: 0 }).withMessage('Amount must be >= 0'),
  body('paymentProvider')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Payment provider too long'),
];
