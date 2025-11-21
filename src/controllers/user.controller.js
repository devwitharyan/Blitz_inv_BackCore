const userModel = require('../models/user.model');
const providerModel = require('../models/provider.model');
const customerModel = require('../models/customer.model');
const addressModel = require('../models/address.model'); 
const mediaModel = require('../models/media.model');
const { success, error } = require('../utils/response');

// 1. List Users (Fix #9: Pagination)
exports.listUsers = async (req, res) => {
  try {
    const { role, page, limit } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const users = await userModel.findAll(role, pageNum, limitNum);
    
    // Optional: You could also return total count here for better UI
    return success(res, users);
  } catch (err) {
    return error(res, err.message);
  }
};

// 2. Get Full User Details 
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // A. Fetch Basic User & Profile Data
    const { user, profile } = await userModel.getFullProfile(userId); 
    
    if (!user) return error(res, 'User not found', 404);

    // B. Fetch Addresses
    const addresses = await addressModel.listByUserId(userId);
    
    // C. Fetch Media (Profile Pic & Documents)
    let media = await mediaModel.listByEntity('User', userId); 
    
    let services = [];
    
    if (user.Role.toLowerCase() === 'provider' && profile) {
      const providerId = profile.Id;
      services = await providerModel.getMyServices(providerId);
      
      const mediaByProfile = await mediaModel.listByEntity('Provider', providerId);
      const mediaByUser = await mediaModel.listByEntity('Provider', userId);
      const providerMedia = [...mediaByProfile, ...mediaByUser];
      media = [...media, ...providerMedia];
    }
    
    const uniqueMedia = Array.from(new Set(media.map(m => m.Id)))
        .map(id => media.find(m => m.Id === id));

    const data = { user, profile, addresses, media: uniqueMedia, services };

    return success(res, data);
  } catch (err) {
    console.error("Error in getUserDetails:", err);
    return error(res, err.message);
  }
};

// 3. Toggle Active Status
exports.toggleStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    await userModel.updateStatus(req.params.id, isActive);
    return success(res, null, 'User status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// 4. Update User Details
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, profile } = req.body;

    if (user) {
      await userModel.updateBasicInfo(id, user);
    }

    const fullData = await userModel.getFullProfile(id);
    if (!fullData || !fullData.user) return error(res, "User not found", 404);

    const role = fullData.user.Role;

    if (profile) {
      if (role === 'provider') {
        await providerModel.updateByUserId(id, profile);
      } 
      else if (role === 'customer') {
        await customerModel.updateByUserId(id, profile);
      }
    }
    
    return success(res, null, 'User details updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};