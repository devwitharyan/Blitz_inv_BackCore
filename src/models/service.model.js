const { sql } = require('../config/db');
const base = require('./base.model');

exports.list = async (filter) => {
  let query = `SELECT * FROM Services`;
  if (filter.categoryId) {
    query += ` WHERE CategoryId = @categoryId`;
    return base.execute(query, [
      { name: 'categoryId', type: sql.UniqueIdentifier, value: filter.categoryId },
    ]);
  }
  return base.execute(query);
};

exports.findById = async (id) => {
  const query = `SELECT * FROM Services WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};

exports.create = async (data) => {
  const { name, description, categoryId, basePrice, duration } = data;
  const query = `
    INSERT INTO Services (Name, Description, CategoryId, BasePrice, Duration)
    OUTPUT INSERTED.*
    VALUES (@name, @description, @categoryId, @basePrice, @duration)
  `;
  return base.executeOne(query, [
    { name: 'name', type: sql.NVarChar, value: name },
    { name: 'description', type: sql.NVarChar, value: description },
    { name: 'categoryId', type: sql.UniqueIdentifier, value: categoryId },
    { name: 'basePrice', type: sql.Decimal(18, 2), value: basePrice },
    { name: 'duration', type: sql.Int, value: duration },
  ]);
};

// --- START OF FIX ---
exports.update = async (id, data) => {
  const { name, description, basePrice, duration } = data;
  
  const params = [{ name: 'id', type: sql.UniqueIdentifier, value: id }];
  const setClauses = [];

  // Dynamically add fields to the update query only if they are provided
  if (name !== undefined) {
    setClauses.push('Name = @name');
    params.push({ name: 'name', type: sql.NVarChar, value: name });
  }
  if (description !== undefined) {
    setClauses.push('Description = @description');
    params.push({ name: 'description', type: sql.NVarChar, value: description });
  }
  if (basePrice !== undefined) {
    setClauses.push('BasePrice = @basePrice');
    params.push({ name: 'basePrice', type: sql.Decimal(18, 2), value: basePrice });
  }
  if (duration !== undefined) {
    setClauses.push('Duration = @duration');
    params.push({ name: 'duration', type: sql.Int, value: duration });
  }

  // If no fields are sent, just return the current service data
  if (setClauses.length === 0) {
    return this.findById(id);
  }

  // Build the dynamic query
  const query = `
    UPDATE Services
    SET ${setClauses.join(', ')}, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @id;
    SELECT * FROM Services WHERE Id = @id
  `;
  
  return base.executeOne(query, params);
};
// --- END OF FIX ---

exports.delete = async (id) => {
  const query = `DELETE FROM Services WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};