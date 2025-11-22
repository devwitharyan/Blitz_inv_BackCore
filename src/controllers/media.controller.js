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
    if (!file) {
      return error(res, 'Not found', 404);
    }

    if (!file.ImageData || file.ImageData.length === 0) {
        return error(res, 'Image data is missing.', 500); 
    }
    
    // Headers
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Content-Type', `image/${file.Format || 'jpeg'}`);
    res.setHeader('Content-Length', file.ImageData.length);
    
    // FIX: Send buffer directly without 'binary' encoding flag
    res.end(file.ImageData); 
    
  } catch (err) {
    console.error("Error serving media:", err);
    if (!res.headersSent) return error(res, err.message);
  }
};