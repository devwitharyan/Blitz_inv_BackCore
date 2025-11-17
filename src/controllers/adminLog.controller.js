const adminLogModel = require('../models/adminLog.model');
const { success, error } = require('../utils/response');

exports.logAction = async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) {
      return error(res, 'Action is required', 400);
    }
    const adminId = req.user.id; // Corrected: Must ensure req.user.id is available

    await adminLogModel.logAction(adminId, action);
    return success(res, null, 'Admin action logged');
  } catch (err) {
    return error(res, err.message);
  }
};


exports.listLogs = async (req, res) => {
  try {
    const logs = await adminLogModel.listLogs();
    return success(res, logs);
  } catch (err) {
    return error(res, err.message);
  }
};