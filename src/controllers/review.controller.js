const reviewModel = require('../models/review.model');
const bookingModel = require('../models/booking.model'); // 1. Import booking model
const { success, error } = require('../utils/response');

exports.createReview = async (req, res) => {
  try {
    // 2. Get data from request
    const { bookingId, serviceId, rating, comment } = req.body;
    const customerId = req.user.id; // 3. Corrected: use req.user.id

    // 4. Find the booking
    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // 5. Validate permissions and status
    if (booking.CustomerId !== customerId) {
      return error(res, 'You are not authorized to review this booking', 403);
    }

    if (booking.Status !== 'completed') {
      return error(res, 'Only completed bookings can be reviewed', 400);
    }

    if (!booking.ProviderId) {
      return error(res, 'This booking has no provider to review', 400);
    }

    // 6. All checks passed, create the review data
    const data = {
      bookingId,
      serviceId,
      customerId,
      providerId: booking.ProviderId, // 7. Get ProviderId from the booking
      rating,
      comment,
    };

    const result = await reviewModel.create(data);
    return success(res, result, 'Review added successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listReviewsForProvider = async (req, res) => {
  try {
    const reviews = await reviewModel.listByProvider(req.params.providerId);
    return success(res, reviews);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listReviewsForService = async (req, res) => {
  try {
    const reviews = await reviewModel.listByService(req.params.serviceId);
    return success(res, reviews);
  } catch (err) {
    return error(res, err.message);
  }
};