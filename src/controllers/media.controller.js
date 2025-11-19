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
    
    // 1. Set the correct Content-Type (image/png or image/jpeg)
    res.setHeader('Content-Type', `image/${file.Format || 'jpeg'}`);
    
    // 2. Set Content-Length explicitly for reliable transfer of binary data
    if (file.ImageData && file.ImageData.length) {
      res.setHeader('Content-Length', file.ImageData.length);
    }
    
    // 3. FIX: Use res.end() with 'binary' encoding to ensure raw buffer transmission
    res.end(file.ImageData, 'binary');
    
  } catch (err) {
    return error(res, err.message);
  }
};