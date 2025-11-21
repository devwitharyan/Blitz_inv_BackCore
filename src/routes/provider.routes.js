const express = require('express');
const router = express.Router();

const providerController = require('../controllers/provider.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const providerValidator = require('../validators/provider.validator');
const { body } = require('express-validator');

// ... [Keep existing routes: /me, /me/verify, /me/credits] ...

// GET /providers/me
router.get('/me', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerController.getMyProfile);

// PUT /providers/me
router.put('/me', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerValidator.updateMe, validate, providerController.updateMyProfile);

// POST /providers/me/verify
router.post('/me/verify', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerValidator.submitVerification, validate, providerController.submitVerification);

// GET /providers/me/credits
router.get('/me/credits', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerController.getMyCredits);


// --- RAZORPAY ROUTES ---

// POST /providers/me/credits/order (Create Order)
router.post(
  '/me/credits/order',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [ 
    body('amount')
      .isInt({ min: 50 }) // UPDATED: Changed from 1 to 50
      .withMessage('Amount must be at least 50') 
  ],
  validate,
  providerController.createTopUpOrder
);

// POST /providers/me/credits/verify (Verify & Add Credits)
router.post(
  '/me/credits/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    body('amount').isInt({ min: 1 })
  ],
  validate,
  providerController.verifyTopUp
);

// ... [Keep Services, Public, and Admin routes] ...
router.get('/me/services', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerController.getMyServices);
router.post('/me/services', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), [ body('serviceId').isUUID(), body('customPrice').optional().isFloat() ], validate, providerController.addMyService);
router.delete('/me/services/:serviceId', authMiddleware.requireAuth, authMiddleware.requireRole('provider'), providerController.removeMyService);

router.get('/', authMiddleware.requireAuth, providerController.listProviders);
router.get('/docs/:userId', authMiddleware.requireAuth, authMiddleware.requireRole('admin'), providerController.listMediaByUserId);
router.put('/:id/verify', authMiddleware.requireAuth, authMiddleware.requireRole('admin'), providerController.verifyProvider);
router.get('/:id', providerController.getProviderById);

module.exports = router;