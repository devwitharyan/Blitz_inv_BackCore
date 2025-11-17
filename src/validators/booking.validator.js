const { body } = require('express-validator');

exports.create = [
  body('addressId').notEmpty().isUUID().withMessage('Valid addressId required'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid date'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.serviceId').isUUID().withMessage('Each service must have a valid UUID'),
  body('services.*.price').isFloat({ min: 0 }).withMessage('Service price must be >= 0'),
];

exports.updateStatus = [
  body('status')
    .notEmpty()
    .isIn(['pending', 'accepted', 'completed', 'cancelled'])
    .withMessage('Invalid booking status'),
];

exports.assignProvider = [
  body('providerId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid providerId required'),
];
