const express = require('express');
const router = express.Router();

const providerController = require('../controllers/provider.controller');
const scheduleController = require('../controllers/schedule.controller'); // For Availability
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const providerValidator = require('../validators/provider.validator');
const { body } = require('express-validator');

// ------------------------------------------
// 🔐 PROVIDER PRIVATE ROUTES (Require Auth)
// ------------------------------------------

// 1. Profile Management
// GET /api/providers/me - Get my profile details
router.get(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.getMyProfile
);

// PUT /api/providers/me - Update my profile (Bio, Experience, etc.)
router.put(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerValidator.updateMe,
  validate,
  providerController.updateMyProfile
);

// POST /api/providers/me/verify - Submit KYC Documents
router.post(
  '/me/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerValidator.submitVerification,
  validate,
  providerController.submitVerification
);

// 2. Availability / Schedule (New Feature)
// GET /api/providers/me/schedule
router.get(
  '/me/schedule',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  scheduleController.getMySchedule
);

// PUT /api/providers/me/schedule
router.put(
  '/me/schedule',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  scheduleController.updateMySchedule
);

// 3. Credits & Wallet (Razorpay)
// GET /api/providers/me/credits
router.get(
  '/me/credits',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.getMyCredits
);

// POST /api/providers/me/credits/order - Initialize Top-up
router.post(
  '/me/credits/order',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [
    body('amount')
      .isInt({ min: 50 })
      .withMessage('Amount must be at least 50'),
  ],
  validate,
  providerController.createTopUpOrder
);

// POST /api/providers/me/credits/verify - Verify Payment & Add Credits
router.post(
  '/me/credits/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    body('amount').isInt({ min: 1 }),
  ],
  validate,
  providerController.verifyTopUp
);

// 4. Service Management (My Services)
// GET /api/providers/me/services
router.get(
  '/me/services',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.getMyServices
);

// POST /api/providers/me/services - Add a service to profile
router.post(
  '/me/services',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [
    body('serviceId').isUUID(),
    body('customPrice').optional().isFloat(),
  ],
  validate,
  providerController.addMyService
);

// DELETE /api/providers/me/services/:serviceId - Remove a service
router.delete(
  '/me/services/:serviceId',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.removeMyService
);

// ------------------------------------------
// 🌍 PUBLIC & ADMIN ROUTES
// ------------------------------------------

// GET /api/providers - List all providers (with optional filters)
router.get(
  '/',
  authMiddleware.requireAuth,
  providerController.listProviders
);

// GET /api/providers/docs/:userId - Get media/docs for a provider (Admin only)
router.get(
  '/docs/:userId',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  providerController.listMediaByUserId
);

// PUT /api/providers/:id/verify - Approve/Reject Provider (Admin only)
router.put(
  '/:id/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  providerController.verifyProvider
);

// GET /api/providers/:id - Get specific provider details (Public/User)
router.get(
  '/:id',
  providerController.getProviderById
);

module.exports = router;