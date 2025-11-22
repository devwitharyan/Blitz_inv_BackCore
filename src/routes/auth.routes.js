const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); 
const authValidator = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { body } = require('express-validator');

console.log('🔥 auth.routes.js loaded');

router.post(
  '/register',
  authValidator.register,
  validate,
  authController.register
);

router.post(
  '/login',
  authValidator.login,
  validate,
  authController.login
);

router.get(
  '/profile',
  authMiddleware.requireAuth, 
  authController.getProfile 
);

router.put(
  '/fcm-token',
  authMiddleware.requireAuth,
  authController.updateFcmToken
);

// NEW: Change Password
router.put(
  '/password',
  authMiddleware.requireAuth,
  [
    body('oldPassword').notEmpty().withMessage('Old password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ chars')
  ],
  validate,
  authController.changePassword
);

// NEW: Delete Account
router.post(
  '/delete',
  authMiddleware.requireAuth,
  [ body('password').notEmpty().withMessage('Password required to delete account') ],
  validate,
  authController.deleteAccount
);

module.exports = router;