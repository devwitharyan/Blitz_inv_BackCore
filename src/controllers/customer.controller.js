const customerModel = require('../models/customer.model');
const mediaModel = require('../models/media.model');
const { success, error } = require('../utils/response');

exports.getMyProfile = async (req, res) => {
  try {
    const customer = await customerModel.findByUserId(req.user.id); 
    
    // FIX: Fetch media linked to the User ID (EntityType 'User') for the profile picture
    if (customer) {
        // We use the User ID (req.user.id) and EntityType 'User'
        const media = await mediaModel.listByEntity('User', req.user.id);
        customer.media = media; // Attach media list to the customer object
    }
    // END FIX
    
    return success(res, customer);
  } catch (err) {
    return error(res, err.message);
  }
};
exports.updateMyProfile = async (req, res) => {
  try {
    const result = await customerModel.updateByUserId(req.user.id, req.body); 
    return success(res, result, 'Customer profile updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const result = await customerModel.findById(req.params.id);
    return result ? success(res, result) : error(res, 'Customer not found', 404);
  } catch (err) {
    return error(res, err.message);
  }
};