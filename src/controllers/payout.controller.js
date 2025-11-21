const payoutModel = require('../models/payout.model');
const providerModel = require('../models/provider.model');
const { success, error } = require('../utils/response');

exports.createPayoutRequest = async (req, res) => {
  try {
    const userId = req.user.id; 

    const provider = await providerModel.findByUserId(userId);
    if (!provider) {
      return error(res, 'Provider profile not found', 404);
    }

    const data = { ...req.body, providerId: provider.Id };
    const result = await payoutModel.createRequest(data);
    
    return success(res, result, 'Payout requested', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listPayoutRequests = async (req, res) => {
  try {
    let providerId = null;
    if (req.user.role !== 'admin') {
      const provider = await providerModel.findByUserId(req.user.id); 
      if (!provider) {
        return error(res, 'Provider profile not found', 404);
      }
      providerId = provider.Id;
    }
    
    const results = await payoutModel.list(providerId);
    return success(res, results);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updatePayoutStatus = async (req, res) => {
  try {
    const result = await payoutModel.updateStatus(req.params.id, req.body.status);
    return success(res, result, 'Payout status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// --- THIS IS THE FUNCTION FETCHING YOUR EARNINGS ---
exports.listMyEarnings = async (req, res) => {
  try {
    console.log(`🔍 Fetching Earnings for User: ${req.user.id}`);

    // 1. Find Provider Profile
    const provider = await providerModel.findByUserId(req.user.id); 
    if (!provider) {
      console.log("❌ Provider Profile NOT FOUND");
      return error(res, 'Provider profile not found', 404);
    }
    
    console.log(`✅ Found Provider ID: ${provider.Id}`);

    // 2. Fetch Earnings from DB
    const earnings = await payoutModel.listEarningsByProvider(provider.Id);
    
    console.log(`📊 Earnings Found: ${earnings.length} records`);
    if (earnings.length > 0) {
      console.log(`💰 Sample Amount: ${earnings[0].Amount}`);
    }

    return success(res, earnings);
  } catch (err) {
    console.error("❌ Error in listMyEarnings:", err);
    return error(res, err.message);
  }
};