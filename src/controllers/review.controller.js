const reviewModel = require('../models/review.model');
const bookingModel = require('../models/booking.model'); 
const { success, error } = require('../utils/response');

exports.createReview = async (req, res) => {
  try {
    const { bookingId, serviceId, rating, comment } = req.body;
    const customerId = req.user.id; 

    const booking = await bookingModel.findById(bookingId);
    
    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    if (booking.CustomerId.toLowerCase() !== customerId.toLowerCase()) {
      return error(res, 'You are not authorized to review this booking', 403);
    }

    if (booking.Status !== 'completed') {
      return error(res, 'Only completed bookings can be reviewed', 400);
    }

    if (!booking.ProviderId) {
      return error(res, 'This booking has no provider to review', 400);
    }

    // Fix #4: Prevent Spamming
    const alreadyReviewed = await reviewModel.exists(bookingId, serviceId);
    if (alreadyReviewed) {
        return error(res, 'You have already reviewed this service for this booking.', 409);
    }

    const data = {
      bookingId,
      serviceId,
      customerId,
      providerId: booking.ProviderId, 
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