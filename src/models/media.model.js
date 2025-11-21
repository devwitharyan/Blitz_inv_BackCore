const { sql } = require('../config/db');
const base = require('./base.model');

exports.upload = async ({ entityId, entityType, mediaType, imageData, format }) => {
  const query = `
    INSERT INTO MediaFiles (EntityId, EntityType, MediaType, ImageData, Format)
    OUTPUT INSERTED.*
    VALUES (@entityId, @entityType, @mediaType, @imageData, @format)
  `;
  return base.executeOne(query, [
    { name: 'entityId', type: sql.UniqueIdentifier, value: entityId },
    { name: 'entityType', type: sql.NVarChar, value: entityType },
    { name: 'mediaType', type: sql.NVarChar, value: mediaType },
    { name: 'imageData', type: sql.VarBinary(sql.MAX), value: imageData },
    { name: 'format', type: sql.NVarChar, value: format },
  ]);
};

exports.listByEntity = async (entityType, entityId) => {
  const query = `SELECT * FROM MediaFiles WHERE EntityType = @entityType AND EntityId = @entityId`;
  return base.execute(query, [
    { name: 'entityType', type: sql.NVarChar, value: entityType },
    { name: 'entityId', type: sql.UniqueIdentifier, value: entityId },
  ]);
};

exports.findById = async (id) => {
  // --- FINAL CRITICAL FIX: Explicitly select ALL columns, forcing ImageData retrieval ---
  const query = `
    SELECT 
        Id, EntityId, EntityType, MediaType, ImageData, Format, CreatedAt 
    FROM MediaFiles 
    WHERE Id = @id
  `;
  return base.executeOne(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
  ]);
};