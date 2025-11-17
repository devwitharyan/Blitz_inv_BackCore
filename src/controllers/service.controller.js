const serviceModel = require('../models/service.model');
const { success, error } = require('../utils/response');

exports.listServices = async (req, res) => {
  try {
    const filter = req.query;
    const services = await serviceModel.list(filter);
    return success(res, services);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await serviceModel.findById(req.params.id);
    return service ? success(res, service) : error(res, 'Service not found', 404);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.createService = async (req, res) => {
  try {
    const result = await serviceModel.create(req.body);
    return success(res, result, 'Service created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.updateService = async (req, res) => {
  try {
    const result = await serviceModel.update(req.params.id, req.body);
    return success(res, result, 'Service updated');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteService = async (req, res) => {
  try {
    await serviceModel.delete(req.params.id);
    return success(res, null, 'Service deleted');
  } catch (err) {
    return error(res, err.message);
  }
};
