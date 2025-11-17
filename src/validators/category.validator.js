const { body } = require('express-validator');

exports.create = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isLength({ max: 1000 }),
];

exports.update = [
  body('name').optional().isString(),
  body('description').optional().isLength({ max: 1000 }),
];
