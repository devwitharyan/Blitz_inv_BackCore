// src/routes/adminLog.routes.js

const express = require('express');
const router = express.Router();

const adminLogController = require('../controllers/adminLog.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRole } = authMiddleware; // Correct destructuring

// GET: List all admin logs (Admin-only)
router.get('/', authMiddleware.requireAuth, requireRole('admin'), adminLogController.listLogs);

// POST: Manually log an admin action (Optional)
router.post('/', authMiddleware.requireAuth, requireRole('admin'), adminLogController.logAction);

module.exports = router;