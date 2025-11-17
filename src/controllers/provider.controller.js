const providerModel = require('../models/provider.model');
const serviceModel = require('../models/service.model');
const { success, error } = require('../utils/response');

exports.getMyProfile = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    
    // Also fetch their selected services
    if (provider) {
        const services = await providerModel.getMyServices(provider.Id);
        provider.services = services;
    }

    return success(res, provider);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const result = await providerModel.updateByUserId(req.user.id, req.body);
    return success(res, result, 'Provider profile updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// --- NEW: Service Management ---
exports.addMyService = async (req, res) => {
    try {
        const { serviceId, customPrice } = req.body;
        const provider = await providerModel.findByUserId(req.user.id);
        
        // Validate Service Exists
        const service = await serviceModel.findById(serviceId);
        if (!service) return error(res, 'Service not found', 404);

        const result = await providerModel.addService(provider.Id, serviceId, customPrice);
        return success(res, result, 'Service added to profile');
    } catch (err) {
        return error(res, err.message);
    }
};

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

exports.getMyServices = async (req, res) => {
    try {
        const provider = await providerModel.findByUserId(req.user.id);
        const services = await providerModel.getMyServices(provider.Id);
        return success(res, services);
    } catch (err) {
        return error(res, err.message);
    }
};
// -------------------------------

exports.submitVerification = async (req, res) => {
  try {
    const result = await providerModel.submitVerification(req.user.id, req.body);
    return success(res, result, 'Verification submitted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listProviders = async (req, res) => {
  try {
    const { lat, long, status } = req.query;
    const providers = await providerModel.listAll(lat, long, status);
    return success(res, providers);
  } catch (err) {
    return error(res);
  }
};

exports.verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
        return error(res, 'Invalid status value', 400);
    }
    const result = await providerModel.verify(id, status);
    return success(res, result, `Provider marked as ${status}`);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getProviderById = async (req, res) => {
  try {
    const provider = await providerModel.findById(req.params.id);
    return provider ? success(res, provider) : error(res, 'Provider not found', 404);
  } catch (err) {
    return error(res);
  }
};