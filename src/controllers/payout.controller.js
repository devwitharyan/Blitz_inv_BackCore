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
    
    // Pass the specific ID (or null for admin) to the model
    const results = await payoutModel.list(providerId);
    return success(res, results);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updatePayoutStatus = async (req, res) => {
  try {
    // This route is admin-only, so no ID lookup is needed here
    const result = await payoutModel.updateStatus(req.params.id, req.body.status);
    return success(res, result, 'Payout status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listMyEarnings = async (req, res) => {
  try {
    // This also needs the Provider.Id, not the User.Id
    const provider = await providerModel.findByUserId(req.user.id); // Corrected: use .id
    if (!provider) {
      return error(res, 'Provider profile not found', 404);
    }

    const earnings = await payoutModel.listEarningsByProvider(provider.Id);
    return success(res, earnings);
  } catch (err) {
    return error(res, err.message);
  }
};