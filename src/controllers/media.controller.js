const mediaModel = require('../models/media.model');
const { success, error } = require('../utils/response');

exports.uploadMedia = async (req, res) => {
  try {
    const { entityId, entityType, mediaType, format } = req.body;
    const file = req.file;

    if (!file) {
      return error(res, 'No file provided', 400);
    }

    const result = await mediaModel.upload({
      entityId,
      entityType,
      mediaType,
      format,
      imageData: file.buffer,
    });

    return success(res, result, 'Media uploaded', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getMediaForEntity = async (req, res) => {
  try {
    const files = await mediaModel.listByEntity(req.params.entityType, req.params.entityId);
    return success(res, files);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const file = await mediaModel.findById(req.params.id);
    if (!file) return error(res, 'Not found', 404);

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    res.setHeader('Content-Type', `image/${file.Format || 'jpeg'}`);
    
    res.send(file.ImageData);
  } catch (err) {
    return error(res, err.message);
  }
};