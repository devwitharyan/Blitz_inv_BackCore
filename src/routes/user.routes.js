const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require Admin role
router.use(authMiddleware.requireAuth, authMiddleware.requireRole('admin'));

router.get('/', userController.listUsers);
router.get('/:id', userController.getUserDetails);
router.put('/:id/status', userController.toggleStatus);
router.put('/:id', userController.updateUser);

module.exports = router;