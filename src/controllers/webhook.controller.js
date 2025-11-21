// src/controllers/webhook.controller.js
const crypto = require('crypto');
const { razorpay } = require('../config/env');
const paymentModel = require('../models/payment.model');
const bookingModel = require('../models/booking.model');
const providerModel = require('../models/provider.model');

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = razorpay.webhookSecret;

    // 1. Validate Webhook Signature (Security Critical)
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    // Razorpay sends signature in this header
    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (digest !== razorpaySignature) {
      console.error("❌ Webhook Signature Mismatch");
      return res.status(400).json({ status: 'invalid signature' });
    }

    // 2. Process Event
    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`🔔 Webhook Received: ${event} | Payment ID: ${payload.id}`);

    if (event === 'payment.captured') {
      await processCapturedPayment(payload);
    } else if (event === 'payment.failed') {
        // Optional: Handle failures (log it, notify user via socket, etc.)
        console.log(`❌ Payment Failed: ${payload.error_description}`);
    }

    // Always return 200 OK to Razorpay immediately to prevent retries
    return res.json({ status: 'ok' });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    // Return 500 so Razorpay knows to retry later if it was a server error
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to handle logic
async function processCapturedPayment(paymentData) {
    const { notes, id: transactionId, amount } = paymentData;
    
    // CASE A: Booking Payment
    if (notes && notes.bookingId) {
        const bookingId = notes.bookingId;
        
        // 1. Idempotency Check: Skip if already paid
        const isPaid = await paymentModel.isPaid(bookingId);
        if (isPaid) {
            console.log(`ℹ️ Booking ${bookingId} already paid. Skipping webhook logic.`);
            return;
        }

        // 2. Fetch Booking Data
        const booking = await bookingModel.findById(bookingId);
        if (!booking) {
            console.error(`❌ Webhook Error: Booking ${bookingId} not found`);
            return;
        }

        // 3. Record Payment & Earnings (Atomic)
        // Note: Amount from Razorpay is in paise, convert to main unit
        const amountInMainUnit = amount / 100;

        await paymentModel.completePaymentTransaction({
            bookingId: bookingId,
            customerId: booking.CustomerId,
            providerId: booking.ProviderId,
            amount: amountInMainUnit, 
            paymentProvider: 'Razorpay',
            transactionId: transactionId
        });

        console.log(`✅ Booking ${bookingId} marked as PAID via Webhook.`);
    }
    
    // CASE B: Provider Wallet Top-up (If you added providerId to notes)
    else if (notes && notes.providerId) {
        // Logic to top up wallet if not already done
        // You would need to implement a 'checkTransactionExists' in providerModel first
        console.log(`ℹ️ Wallet Top-up for Provider ${notes.providerId} detected.`);
    }
    else {
        console.warn("⚠️ Payment captured but no 'notes' found to identify the purpose.");
    }
}