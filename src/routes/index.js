const express = require('express');
const router = express.Router();

// Debug logs
console.log('➡️ Loading API routes...');
console.log('📁 Routes loaded:', __dirname);
router.get('/auth-check', (req, res) => {
  res.json({ success: true, message: 'Auth route mounted correctly' });
});

// 🔐 AUTH ROUTES
router.use('/auth', require('./auth.routes'));

// 🗂️ OTHER ROUTES
router.use('/categories', require('./category.routes'));
router.use('/addresses', require('./address.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/providers', require('./provider.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/payouts', require('./payout.routes'));
router.use('/media', require('./media.routes'));
router.use('/admin-logs', require('./adminLog.routes'));
router.use('/users', require('./user.routes'));

router.use('/services', require('./service.routes'));

// Root health check for /api
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is working 🚀',
    availableRoutes: [
      '/api/auth',
      '/api/categories',
      '/api/bookings',
      '/api/services', 
      '...',
    ],
  });
});

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test route works!' });
});

module.exports = router;