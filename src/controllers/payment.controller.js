const paymentModel = require('../models/payment.model');
const bookingModel = require('../models/booking.model');
const payoutModel = require('../models/payout.model');
const { success, error } = require('../utils/response');

exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentProvider } = req.body;
    const customerId = req.user.id;

    // 1. Validation
    const booking = await bookingModel.findById(bookingId);
    if (!booking) return error(res, 'Booking not found', 404);

    if (booking.CustomerId.toLowerCase() !== customerId.toLowerCase()) {
      return error(res, 'Unauthorized', 403);
    }
    if (!booking.ProviderId) {
      return error(res, 'Provider not assigned', 400);
    }

    // 2. CRITICAL FIX: Check if already paid
    const alreadyPaid = await paymentModel.isPaid(bookingId);
    if (alreadyPaid) {
        return error(res, 'Booking is already paid.', 409);
    }

    // 3. Create Payment Record
    const result = await paymentModel.create({
      bookingId,
      amount,
      paymentProvider,
      customerId: customerId,
      providerId: booking.ProviderId,
    });

    // 4. Credit Provider Wallet
    await payoutModel.addTransaction({
        providerId: booking.ProviderId,
        bookingId: bookingId,
        amount: amount,
        type: 'earnings'
    });

    return success(res, result, 'Payment successful', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

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