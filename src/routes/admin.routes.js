// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET: Dashboard Stats (Admin-only)
router.get(
  '/stats',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  adminController.getDashboardStats
);

module.exports = router;