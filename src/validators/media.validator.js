const { body } = require('express-validator');

exports.upload = [
  body('entityId').notEmpty().isUUID(),
  body('entityType').notEmpty().isString(),
  body('mediaType').optional().isString(),
  body('format').optional().isIn(['jpg', 'jpeg', 'png']).withMessage('Invalid image format'),
];
