const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const categoryValidator = require('../validators/category.validator');

// Public route - get all categories
router.get('/', categoryController.listCategories);

// Admin-only routes
router.post(
  '/',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  categoryValidator.create,
  validate,
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  categoryValidator.update,
  validate,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware.requireAuth,
  authMiddleware.requireRole('admin'),
  categoryController.deleteCategory
);

module.exports = router;
