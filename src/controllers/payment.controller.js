const Razorpay = require('razorpay');
const crypto = require('crypto');
const { razorpay } = require('../config/env');
const paymentModel = require('../models/payment.model');
const bookingModel = require('../models/booking.model');
const payoutModel = require('../models/payout.model');
const { success, error } = require('../utils/response');

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: razorpay.keyId,
  key_secret: razorpay.keySecret,
});

// 1. Create Order for specific Booking
exports.initiateBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;
    
    // A. Validation
    const booking = await bookingModel.findById(bookingId);
    if (!booking) return error(res, 'Booking not found', 404);

    if (booking.CustomerId.toLowerCase() !== userId.toLowerCase()) {
        return error(res, 'Unauthorized: This booking does not belong to you', 403);
    }

    if (booking.Status === 'cancelled') {
        return error(res, 'Cannot pay for a cancelled booking', 400);
    }

    // B. Check if already paid
    const alreadyPaid = await paymentModel.isPaid(bookingId);
    if (alreadyPaid) {
        return error(res, 'Booking is already paid.', 409);
    }

    // C. Validate Price
    if (!booking.Price || booking.Price <= 0) {
        return error(res, 'Invalid booking price', 400);
    }

    // D. Create Razorpay Order
    const options = {
      amount: Math.round(booking.Price * 100), // Convert to paise
      currency: "INR",
      receipt: `book_${bookingId.substring(0, 8)}_${Date.now()}`,
      notes: { 
        bookingId: bookingId 
      }
    };

    const order = await razorpayInstance.orders.create(options);

    return success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpay.keyId,
      bookingId: bookingId
    }, 'Payment Order Created');

  } catch (err) {
    console.error("Razorpay Booking Order Error:", err);
    return error(res, 'Failed to initiate payment', 500);
  }
};

// 2. Verify Payment & Record It (Secure)
exports.verifyBookingPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const customerId = req.user.id;

    // A. Crypto Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error(`❌ Signature Mismatch: Expected ${expectedSignature}, Got ${razorpay_signature}`);
      return error(res, 'Invalid Payment Signature', 400);
    }

    // B. Fetch Booking Details
    const booking = await bookingModel.findById(bookingId);
    if (!booking) return error(res, 'Booking not found', 404);

    // C. Idempotency Check (Double Payment Prevention)
    const alreadyPaid = await paymentModel.isPaid(bookingId);
    if (alreadyPaid) {
        return success(res, null, 'Payment already recorded'); // Return success to avoid client-side confusion
    }

    // D. Atomic Transaction (Save Payment + Add Earnings)
    const paymentRecord = await paymentModel.completePaymentTransaction({
      bookingId,
      customerId,
      providerId: booking.ProviderId,
      amount: booking.Price, // Use DB price for security, not req.body
      paymentProvider: 'Razorpay',
      transactionId: razorpay_payment_id
    });
    
    return success(res, paymentRecord, 'Payment Verified & Recorded!');

  } catch (err) {
    console.error("Razorpay Verify Booking Error:", err);
    return error(res, 'Payment verification failed', 500);
  }
};

// --- GETTERS ---

exports.getPaymentByBooking = async (req, res) => {
  try {
    const payment = await paymentModel.findByBookingId(req.params.bookingId);
    return payment ? success(res, payment) : error(res, 'Payment not found', 404);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listMyPayments = async (req, res) => {
  try {
    const payments = await paymentModel.listByUser(req.user.id);
    return success(res, payments);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listAllPayments = async (req, res) => {
  try {
    const payments = await paymentModel.listAll();
    return success(res, payments);
  } catch (err) {
    return error(res, err.message);
  }
};

// Legacy Create (Optional - for Cash)
exports.createPayment = async (req, res) => {
    // ... (Keep if you still support offline cash recording)
    return error(res, 'Please use /order endpoint for online payments', 400);
};