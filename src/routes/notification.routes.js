const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// GET /notifications
router.get(
  '/',
  authMiddleware.requireAuth,
  notificationController.listMyNotifications
);

// PUT /notifications/:id/read
router.put(
  '/:id/read',
  authMiddleware.requireAuth,
  notificationController.markAsRead
);

module.exports = router;
