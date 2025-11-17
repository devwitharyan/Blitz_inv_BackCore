const { body } = require('express-validator');

exports.create = [
  body('label').notEmpty().withMessage('Label is required'),
  body('line1').notEmpty().withMessage('Line1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').notEmpty().isLength({ min: 5, max: 10 }).withMessage('Valid pincode required'),
  body('latitude').optional().isFloat().withMessage('Latitude must be a number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a number'),
];

exports.update = [
  body('label').optional(),
  body('line1').optional(),
  body('line2').optional(),
];
