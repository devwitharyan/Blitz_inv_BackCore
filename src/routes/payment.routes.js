const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { body } = require('express-validator');

// --- RAZORPAY ROUTES (CUSTOMER) ---

// POST /api/payments/order (Start Payment)
router.post(
  '/order',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  [ 
    body('bookingId').isUUID().withMessage('Valid Booking ID required') 
  ],
  validate,
  paymentController.initiateBookingPayment
);

// POST /api/payments/verify (Complete Payment)
router.post(
  '/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  [
    body('razorpay_order_id').notEmpty().withMessage('Order ID required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID required'),
    body('razorpay_signature').notEmpty().withMessage('Signature required'),
    body('bookingId').isUUID().withMessage('Valid Booking ID required')
  ],
  validate,
  paymentController.verifyBookingPayment
);

// --- HISTORY & ADMIN ROUTES ---

// GET /api/payments (Admin)
router.get(
  '/', 
  authMiddleware.requireAuth, 
  authMiddleware.requireRole('admin'), 
  paymentController.listAllPayments
);

// GET /api/payments/booking/:bookingId
router.get(
  '/booking/:bookingId', 
  authMiddleware.requireAuth, 
  paymentController.getPaymentByBooking
);

// GET /api/payments/user (My History)
router.get(
  '/user', 
  authMiddleware.requireAuth, 
  paymentController.listMyPayments
);

module.exports = router;