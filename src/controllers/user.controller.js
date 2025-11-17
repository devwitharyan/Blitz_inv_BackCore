const userModel = require('../models/user.model');
const providerModel = require('../models/provider.model');
const customerModel = require('../models/customer.model');
const addressModel = require('../models/address.model'); // <--- ADDED THIS IMPORT
const mediaModel = require('../models/media.model');
const { success, error } = require('../utils/response');

// 1. List All Users
exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await userModel.findAll(role);
    return success(res, users);
  } catch (err) {
    // 👇 TEMPORARY: RETURN FULL ERROR OBJECT FOR DEBUGGING 👇
    console.error("CRASH IN listUsers:", err); 
    // This will send the error message (e.g., "Invalid column name...") 
    // back to the Admin Panel's browser console.
    return error(res, "Database query failed", 500, { detail: err.message }); 
    // 👆 END TEMPORARY FIX 👆
  }
};

// 2. Get Full User Details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    // userModel.getFullProfile fetches { user, profile }
    const { user, profile } = await userModel.getFullProfile(userId); 
    
    if (!user) return error(res, 'User not found', 404);

    // 1. Fetch Shared Data (Addresses and User Media)
    const addresses = await addressModel.listByUserId(userId);
    // Profile media (for profile pic/avatar) linked directly to the User ID
    let media = await mediaModel.listByEntity('User', userId); 
    
    let services = [];
    
    // 2. Fetch Role-Specific Data
    if (user.Role.toLowerCase() === 'provider' && profile) {
      const providerId = profile.Id;
      
      // Provider's linked services/skills
      services = await providerModel.getMyServices(providerId);
      
      // Documents (Aadhar, PAN) linked to the Provider Profile ID
      const providerMedia = await mediaModel.listByEntity('Provider', providerId); 
      media = [...media, ...providerMedia]; // Combine all media
    }

    // 3. Aggregate everything into a single response object
    const data = { user, profile, addresses, media, services };

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

    // Update Basic User Info
    if (user) {
      await userModel.updateBasicInfo(id, user);
    }

    // Update Profile Info based on Role
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