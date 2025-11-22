const payoutModel = require('../models/payout.model');
const providerModel = require('../models/provider.model');
const { success, error } = require('../utils/response');

exports.createPayoutRequest = async (req, res) => {
  try {
    const userId = req.user.id; 
    const provider = await providerModel.findByUserId(userId);
    if (!provider) return error(res, 'Provider profile not found', 404);

    const data = { ...req.body, providerId: provider.Id };
    const result = await payoutModel.createRequest(data);
    
    if (!result) {
        return error(res, 'Insufficient balance for this withdrawal request.', 400);
    }
    
    return success(res, result, 'Payout requested', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listPayoutRequests = async (req, res) => {
  try {
    // Admin function
    const results = await payoutModel.list();
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

// --- UPDATED: Returns Full Wallet Summary ---
exports.listMyEarnings = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id); 
    if (!provider) return error(res, 'Provider profile not found', 404);
    
    const walletData = await payoutModel.getWalletDetails(provider.Id);
    
    return success(res, walletData);
  } catch (err) {
    return error(res, err.message);
  }
};