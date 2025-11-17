const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const paymentValidator = require('../validators/payment.validator');

// POST /payments (Customer pays)
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  paymentValidator.create,
  validate,
  paymentController.createPayment
);

// GET /payments (Admin sees all) -- MUST BE BEFORE /:id routes
router.get(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  paymentController.listAllPayments
);

// GET /payments/booking/:bookingId
router.get(
  '/booking/:bookingId',
  authMiddleware.requireAuth,
  paymentController.getPaymentByBooking
);

// GET /payments/user (My History)
router.get(
  '/user',
  authMiddleware.requireAuth,
  paymentController.listMyPayments
);

module.exports = router;