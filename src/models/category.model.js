const { sql } = require('../config/db');
const base = require('./base.model');

exports.getAll = async () => {
  const query = `SELECT * FROM ServiceCategories ORDER BY Name ASC`;
  return base.execute(query);
};

exports.create = async (data) => {
  const query = `
    INSERT INTO ServiceCategories (Name, Description)
    OUTPUT INSERTED.*
    VALUES (@name, @description)
  `;
  return base.executeOne(query, [
    { name: 'name', type: sql.NVarChar, value: data.name },
    { name: 'description', type: sql.NVarChar, value: data.description },
  ]);
};

exports.update = async (id, data) => {
  const query = `
    UPDATE ServiceCategories
    SET Name = @name, Description = @description, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @id;
    SELECT * FROM ServiceCategories WHERE Id = @id;
  `;
  return base.executeOne(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
    { name: 'name', type: sql.NVarChar, value: data.name },
    { name: 'description', type: sql.NVarChar, value: data.description },
  ]);
};

exports.remove = async (id) => {
  const query = `DELETE FROM ServiceCategories WHERE Id = @id`;
  return base.execute(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
  ]);
};
