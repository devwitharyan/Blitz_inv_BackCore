const Razorpay = require('razorpay');
const crypto = require('crypto');
const providerModel = require('../models/provider.model');
const serviceModel = require('../models/service.model');
const mediaModel = require('../models/media.model');
const { razorpay } = require('../config/env');
const { success, error } = require('../utils/response');

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: razorpay.keyId,
  key_secret: razorpay.keySecret,
});

// Get My Profile
exports.getMyProfile = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (provider) {
        const services = await providerModel.getMyServices(provider.Id);
        provider.services = services;
    }
    return success(res, provider);
  } catch (err) {
    return error(res, err.message);
  }
};

// Update Profile
exports.updateMyProfile = async (req, res) => {
  try {
    const result = await providerModel.updateByUserId(req.user.id, req.body);
    return success(res, result, 'Provider profile updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// Submit Verification (KYC)
exports.submitVerification = async (req, res) => {
  try {
    const result = await providerModel.submitVerification(req.user.id, req.body);
    return success(res, result, 'Verification submitted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// Add Service
exports.addMyService = async (req, res) => {
    try {
        const { serviceId, customPrice } = req.body;
        const provider = await providerModel.findByUserId(req.user.id);
        const service = await serviceModel.findById(serviceId);
        if (!service) return error(res, 'Service not found', 404);
        const result = await providerModel.addService(provider.Id, serviceId, customPrice);
        return success(res, result, 'Service added to profile');
    } catch (err) {
        return error(res, err.message);
    }
};

// Remove Service
exports.removeMyService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const provider = await providerModel.findByUserId(req.user.id);
        await providerModel.removeService(provider.Id, serviceId);
        return success(res, null, 'Service removed from profile');
    } catch (err) {
        return error(res, err.message);
    }
};

// Get My Services
exports.getMyServices = async (req, res) => {
    try {
        const provider = await providerModel.findByUserId(req.user.id);
        const services = await providerModel.getMyServices(provider.Id);
        return success(res, services);
    } catch (err) {
        return error(res, err.message);
    }
};

// List Providers (Public/Admin)
exports.listProviders = async (req, res) => {
  try {
    const { lat, long, status } = req.query;
    const providers = await providerModel.listAll(lat, long, status);
    return success(res, providers);
  } catch (err) {
    return error(res);
  }
};

// Verify Provider (Admin)
exports.verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await providerModel.verify(id, status);
    return success(res, result, `Provider marked as ${status}`);
  } catch (err) {
    return error(res, err.message);
  }
};

// Get Provider by ID
exports.getProviderById = async (req, res) => {
  try {
    const provider = await providerModel.findById(req.params.id);
    return provider ? success(res, provider) : error(res, 'Provider not found', 404);
  } catch (err) {
    return error(res);
  }
};

// List Media
exports.listMediaByUserId = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const provider = await providerModel.findByUserId(userId);
    if (!provider) return error(res, 'Provider profile not found.', 404);
    const mediaByProfileId = await mediaModel.listByEntity('Provider', provider.Id);
    const mediaByUserId = await mediaModel.listByEntity('Provider', userId);
    const combinedMedia = [...mediaByProfileId, ...mediaByUserId]; 
    const uniqueMedia = Array.from(new Set(combinedMedia.map(m => m.Id)))
        .map(id => combinedMedia.find(m => m.Id === id));
    return success(res, uniqueMedia);
  } catch (err) {
    return error(res, err.message);
  }
};

// Get Credits
exports.getMyCredits = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider not found', 404);

    const credits = await providerModel.getCredits(provider.Id);
    return success(res, { credits });
  } catch (err) {
    return error(res, err.message);
  }
};

// --- RAZORPAY INTEGRATION ---

// Create Top-up Order
exports.createTopUpOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1) {
      return error(res, 'Invalid amount', 400);
    }

    const options = {
      amount: amount * 100, // Razorpay takes amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        providerId: req.user.id
      }
    };

    const order = await razorpayInstance.orders.create(options);

    return success(res, {
      orderId: order.id,
      amount: order.amount,
      keyId: razorpay.keyId 
    }, 'Order created');

  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    return error(res, 'Payment initiation failed', 500);
  }
};

// Verify Top-up
exports.verifyTopUp = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider not found', 404);

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const creditsToAdd = parseInt(amount); 
      const result = await providerModel.topUpCredits(provider.Id, creditsToAdd, razorpay_payment_id);
      return success(res, { credits: result.Credits }, 'Payment Verified & Wallet Topped Up!');
    } else {
      return error(res, 'Invalid Payment Signature', 400);
    }
  } catch (err) {
    console.error("Razorpay Verify Error:", err);
    return error(res, 'Payment verification failed', 500);
  }
};