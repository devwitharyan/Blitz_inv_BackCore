const express = require('express');
const router = express.Router();

const addressController = require('../controllers/address.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const addressValidator = require('../validators/address.validator');

// POST /addresses
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyRole('customer', 'provider'),
  addressValidator.create,
  validate,
  addressController.createAddress
);

// GET /addresses
router.get(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyRole('customer', 'provider'),
  addressController.listMyAddresses
);

// PUT /addresses/:id
router.put(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyRole('customer', 'provider'),
  addressValidator.update,
  validate,
  addressController.updateAddress
);

// DELETE /addresses/:id
router.delete(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyRole('customer', 'provider'),
  addressController.deleteAddress
);

module.exports = router;
