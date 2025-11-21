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
      console.log(`[MEDIA] 404: File ID ${req.params.id} not found.`);
      return error(res, 'Not found', 404);
    }

    // --- CRITICAL NULL/EMPTY CHECK ---
    if (!file.ImageData || file.ImageData.length === 0) {
        console.error(`[MEDIA] 500: ImageData is null/empty for ID ${req.params.id}.`);
        return error(res, 'Image data is missing or corrupted.', 500); 
    }
    console.log(`[MEDIA] Serving ID ${req.params.id}. Size: ${file.ImageData.length} bytes.`);
    // ----------------------------------------
    
    // --- FIX 1: Headers for Reliability and Security ---
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', `image/${file.Format || 'jpeg'}`);
    
    // --- FIX 2: Explicit Content-Length and res.end() for guaranteed binary stream ---
    res.setHeader('Content-Length', file.ImageData.length);
    res.end(file.ImageData, 'binary'); // Send the raw buffer and close the stream
    
  } catch (err) {
    console.error("Error serving media:", err);
    // Note: If headers were already sent, this might crash the server, but it's the right final logic
    return error(res, err.message);
  }
};