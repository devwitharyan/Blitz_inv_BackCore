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

    // --- FIX FOR net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin ---
    // This header is essential for allowing the image to load cross-origin (e.g., C# App on one port, Node.js API on port 3000).
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // --- FIX 2.B: Add Caching Headers ---
    // "public": can be cached by intermediate proxies/CDNs
    // "max-age=86400": Cache is valid for 24 hours (86400 seconds)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Ensure correct content type
    res.setHeader('Content-Type', `image/${file.Format || 'jpeg'}`);
    
    res.send(file.ImageData);
  } catch (err) {
    return error(res, err.message);
  }
};