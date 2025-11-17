const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const reviewValidator = require('../validators/review.validator');

// POST /reviews
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  reviewValidator.create,
  validate,
  reviewController.createReview
);

// GET /reviews/provider/:providerId
router.get(
  '/provider/:providerId',
  reviewController.listReviewsForProvider
);

// GET /reviews/service/:serviceId
router.get(
  '/service/:serviceId',
  reviewController.listReviewsForService
);

module.exports = router;
