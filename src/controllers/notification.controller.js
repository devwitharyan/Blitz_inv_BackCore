const notificationModel = require('../models/notification.model');
const { success, error } = require('../utils/response');

exports.listMyNotifications = async (req, res) => {
  try {
    const results = await notificationModel.listByUser(req.user.id); // Corrected
    return success(res, results);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationModel.markAsRead(req.params.id);
    return success(res, null, 'Notification marked as read');
  } catch (err) {
    return error(res, err.message);
  }
};