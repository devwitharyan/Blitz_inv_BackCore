const express = require('express');
const router = express.Router();

const mediaController = require('../controllers/media.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const mediaValidator = require('../validators/media.validator');
const uploadMiddleware = require('../middleware/upload.middleware');

// POST /media
router.post(
  '/',
  authMiddleware.requireAuth,
  uploadMiddleware.single('file'), // Middleware FIRST to parse file
  mediaValidator.upload,
  validate,
  mediaController.uploadMedia
);

// 🚨 CRITICAL FIX: This specific route MUST come BEFORE the generic one below
// GET /media/file/:id  (direct file download)
router.get(
  '/file/:id',
  mediaController.getMediaById
);

// GET /media/:entityType/:entityId (Generic route matches anything else)
router.get(
  '/:entityType/:entityId',
  mediaController.getMediaForEntity
);

module.exports = router;