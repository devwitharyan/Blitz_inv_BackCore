const express = require('express');
const router = express.Router();

const providerController = require('../controllers/provider.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const providerValidator = require('../validators/provider.validator');
const { body } = require('express-validator');

// --- PROVIDER PROFILE ROUTES ---

// GET /providers/me (Includes linked services)
router.get(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.getMyProfile
);

// PUT /providers/me (Bio, Experience)
router.put(
  '/me',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerValidator.updateMe,
  validate,
  providerController.updateMyProfile
);

// POST /providers/me/verify (Docs)
router.post(
  '/me/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerValidator.submitVerification,
  validate,
  providerController.submitVerification
);

// --- NEW: SERVICE MANAGEMENT ROUTES ---

// GET /providers/me/services (List my skills)
router.get(
  '/me/services',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.getMyServices
);

// POST /providers/me/services (Add a skill)
router.post(
  '/me/services',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  [
      body('serviceId').isUUID().withMessage('Valid Service ID required'),
      body('customPrice').optional().isFloat({ min: 0 })
  ],
  validate,
  providerController.addMyService
);

// DELETE /providers/me/services/:serviceId (Remove a skill)
router.delete(
  '/me/services/:serviceId',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('provider'),
  providerController.removeMyService
);

// --- PUBLIC / ADMIN ROUTES ---

// GET /providers (List all)
router.get(
  '/', 
  authMiddleware.requireAuth, 
  providerController.listProviders
);

// PUT /providers/:id/verify (Admin Approve)
router.put(
  '/:id/verify',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  providerController.verifyProvider
);

// GET /providers/:id (Public Details)
router.get(
  '/:id', 
  providerController.getProviderById
);

module.exports = router;