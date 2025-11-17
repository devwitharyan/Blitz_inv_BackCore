const addressModel = require('../models/address.model');
const { success, error } = require('../utils/response');

exports.createAddress = async (req, res) => {
  try {
    const { label, line1, line2, city, state, pincode, latitude, longitude } = req.body;
    const userId = req.user.id; 

    const result = await addressModel.create({
      userId,
      label, line1, line2, city, state, pincode, latitude, longitude,
    });

    return success(res, result, 'Address created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.listMyAddresses = async (req, res) => {
  try {
    const userId = req.user.id; 
    const results = await addressModel.listByUserId(userId);
    return success(res, results);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 

    const updated = await addressModel.updateById(id, userId, req.body);
    return success(res, updated, 'Address updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 

    await addressModel.deleteById(id, userId);
    return success(res, null, 'Address deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};