const express = require('express');
const router = express.Router();

const payoutController = require('../controllers/payout.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const payoutValidator = require('../validators/payout.validator');

// POST /payouts
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  payoutValidator.create,
  validate,
  payoutController.createPayoutRequest
);

// GET /payouts (provider: own, admin: all)
router.get(
  '/',
  authMiddleware.requireAuth,
  payoutController.listPayoutRequests
);

// PUT /payouts/:id/status (admin)
router.put(
  '/:id/status',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  payoutValidator.updateStatus,
  validate,
  payoutController.updatePayoutStatus
);

// GET /earnings (provider only)
router.get(
  '/earnings/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  payoutController.listMyEarnings
);

module.exports = router;
