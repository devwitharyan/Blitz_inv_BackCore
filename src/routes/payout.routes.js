const express = require('express');
const router = express.Router();

const payoutController = require('../controllers/payout.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const payoutValidator = require('../validators/payout.validator');

// POST /api/payouts (Request Withdraw)
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  payoutValidator.create,
  validate,
  payoutController.createPayoutRequest
);

// GET /api/payouts (List Withdraw Requests)
router.get(
  '/',
  authMiddleware.requireAuth,
  payoutController.listPayoutRequests
);

// PUT /api/payouts/:id/status (Admin Approve/Reject)
router.put(
  '/:id/status',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  payoutValidator.updateStatus,
  validate,
  payoutController.updatePayoutStatus
);

// GET /api/payouts/earnings/me (List Wallet History)
router.get(
  '/earnings/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  payoutController.listMyEarnings // Matches the function above
);

module.exports = router;