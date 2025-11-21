const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller'); 
const authValidator = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');

console.log('🔥 auth.routes.js loaded');

// Register route
router.post(
  '/register',
  authValidator.register,
  validate,
  authController.register
);

// Login route
router.post(
  '/login',
  authValidator.login,
  validate,
  authController.login
);

// GET /auth/profile
router.get(
  '/profile',
  authMiddleware.requireAuth, 
  authController.getProfile 
);

// NEW: PUT /auth/fcm-token
router.put(
  '/fcm-token',
  authMiddleware.requireAuth,
  authController.updateFcmToken
);

module.exports = router;