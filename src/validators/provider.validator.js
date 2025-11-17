const { body } = require('express-validator');

exports.updateMe = [
  body('bio')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bio should be 10 to 1000 characters'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
];

exports.submitVerification = [
  body('aadharNo')
    .notEmpty()
    .isLength({ min: 12, max: 12 })
    .withMessage('Aadhar number must be 12 digits'),
  body('panNo')
    .notEmpty()
    .isLength({ min: 10, max: 10 })
    .withMessage('PAN number must be 10 characters'),
];
