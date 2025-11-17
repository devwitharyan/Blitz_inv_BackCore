const { body } = require('express-validator');

exports.create = [
  body('amount').notEmpty().isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
];

exports.updateStatus = [
  body('status')
    .notEmpty()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be valid'),
];
