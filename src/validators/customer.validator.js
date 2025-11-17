const { body } = require('express-validator');

exports.updateMe = [
  body('birthdate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date format'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female or other'),
];
