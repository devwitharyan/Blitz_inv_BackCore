// src/routes/booking.routes.js

const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const bookingValidator = require('../validators/booking.validator');

// POST /bookings (Create)
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('customer'),
  bookingValidator.create,
  validate,
  bookingController.createBooking
);

// --- FIX: Add this route BEFORE the /:id route ---
// GET /bookings/available (Provider Radar)
router.get(
  '/available',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  bookingController.listAvailableJobs
);

// NEW: GET /bookings/recent-clients
router.get(
  '/recent-clients',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  bookingController.getRecentClients
);
// --------------------------------------------------

// PUT /bookings/:id/accept (Provider Claims Job)
router.put(
  '/:id/accept', 
  authMiddleware.requireAuth, 
  authMiddleware.requireRole('provider'), 
  bookingController.acceptJob
);

// GET /bookings/me
router.get(
  '/me',
  authMiddleware.requireAuth,
  bookingController.listMyBookings 
);

// === CRITICAL FIX: Add specific routes here, BEFORE the generic /:id route ===
// NEW ROUTE: GET /bookings/:id/services (Fetch linked services for a booking)
router.get(
  '/:id/services',
  authMiddleware.requireAuth,
  bookingController.getBookingServices
);
// ============================================================================


// GET /bookings/:id (Generic route must be LAST)
router.get(
  '/:id',
  authMiddleware.requireAuth,
  bookingController.getBookingById
);

// PUT /bookings/:id/status
router.put(
  '/:id/status',
  authMiddleware.requireAuth,
  authMiddleware.requireAnyRole('provider', 'admin', 'customer'),
  bookingValidator.updateStatus,
  validate,
  bookingController.updateBookingStatus
);

// POST /bookings/:id/assign (admin)
router.post(
  '/:id/assign',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  bookingValidator.assignProvider,
  validate,
  bookingController.assignProvider
);

module.exports = router;