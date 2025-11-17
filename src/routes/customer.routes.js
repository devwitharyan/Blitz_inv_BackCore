const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const customerValidator = require('../validators/customer.validator');

// GET /customers/me
router.get(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  customerController.getMyProfile
);

// PUT /customers/me
router.put(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  customerValidator.updateMe,
  validate,
  customerController.updateMyProfile
);

// GET /customers/:id (admin)
router.get(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  customerController.getCustomerById
);

module.exports = router;
