const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/service.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const serviceValidator = require('../validators/service.validator');

// GET /services
router.get('/', serviceController.listServices);

// GET /services/:id
router.get('/:id', serviceController.getServiceById);

// POST /services (admin)
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  serviceValidator.create,
  validate,
  serviceController.createService
);

// PUT /services/:id (admin)
router.put(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  serviceValidator.update,
  validate,
  serviceController.updateService
);

// DELETE /services/:id (admin)
router.delete(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  serviceController.deleteService
);

module.exports = router;
