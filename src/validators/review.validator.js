const { body } = require('express-validator');

exports.create = [
  body('bookingId').notEmpty().isUUID(),
  body('serviceId').notEmpty().isUUID(),
  // body('providerId').notEmpty().isUUID(), // OLD: Remove this line
  body('rating').notEmpty().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('comment').optional().isLength({ max: 2000 }),
];