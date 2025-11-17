const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller'); 
const authValidator = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware'); // Import auth middleware

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
  authMiddleware.requireAuth, // Protect the route
  authController.getProfile // Add new controller function
);

module.exports = router;