const { body } = require('express-validator');

exports.create = [
  body('name').notEmpty().withMessage('Service name is required'),
  body('categoryId').notEmpty().isUUID().withMessage('Valid categoryId is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a number >= 0'),
  body('duration').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
];

exports.update = [
  body('name').optional().isString(),
  body('basePrice').optional().isFloat({ min: 0 }),
];
