const scheduleModel = require('../models/schedule.model');
const providerModel = require('../models/provider.model');
const { success, error } = require('../utils/response');

exports.getMySchedule = async (req, res) => {
  try {
    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider not found', 404);

    const schedule = await scheduleModel.getSchedule(provider.Id);
    return success(res, schedule);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateMySchedule = async (req, res) => {
  try {
    const { schedule } = req.body; // Array of day objects
    if (!Array.isArray(schedule)) return error(res, 'Invalid format', 400);

    const provider = await providerModel.findByUserId(req.user.id);
    if (!provider) return error(res, 'Provider not found', 404);

    await scheduleModel.updateSchedule(provider.Id, schedule);
    return success(res, null, 'Availability updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};