const { body } = require('express-validator');

exports.create = [
  body('addressId').notEmpty().isUUID().withMessage('Valid addressId required'),
  
  // Updated: Made required and added past-date check
  body('scheduledAt')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('scheduledAt must be a valid ISO8601 date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      
      if (scheduledDate < now) {
        throw new Error('Bookings cannot be scheduled in the past');
      }
      return true;
    }),

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