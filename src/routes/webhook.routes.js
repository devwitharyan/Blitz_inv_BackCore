// src/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// POST /api/webhooks/razorpay
router.post(
    '/razorpay', 
    // Note: No auth middleware here! Razorpay servers cannot provide your JWT token.
    // Security is handled via the Signature Verification inside the controller.
    webhookController.handleRazorpayWebhook
);

module.exports = router;