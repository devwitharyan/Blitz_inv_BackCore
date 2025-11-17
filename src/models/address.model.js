const { sql } = require('../config/db');
const base = require('./base.model');

exports.create = async (data) => {
  const query = `
    INSERT INTO Addresses (UserId, Label, Line1, Line2, City, State, Pincode, Latitude, Longitude)
    OUTPUT INSERTED.*
    VALUES (@userId, @label, @line1, @line2, @city, @state, @pincode, @latitude, @longitude)
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: data.userId },
    { name: 'label', type: sql.NVarChar, value: data.label },
    { name: 'line1', type: sql.NVarChar, value: data.line1 },
    { name: 'line2', type: sql.NVarChar, value: data.line2 },
    { name: 'city', type: sql.NVarChar, value: data.city },
    { name: 'state', type: sql.NVarChar, value: data.state },
    { name: 'pincode', type: sql.NVarChar, value: data.pincode },
    { name: 'latitude', type: sql.Float, value: data.latitude },
    { name: 'longitude', type: sql.Float, value: data.longitude },
  ]);
};

exports.listByUserId = async (userId) => {
  const query = `
    SELECT Id, UserId, Label, Line1, Line2, City, State, Pincode, Latitude, Longitude, CreatedAt, UpdatedAt 
    FROM Addresses 
    WHERE UserId = @userId
  `;
  return base.execute(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};
exports.findById = async (id) => {
  const query = `SELECT * FROM Addresses WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};

exports.updateById = async (id, userId, data) => {
  const query = `
    UPDATE Addresses
    SET Label = @label, Line1 = @line1, Line2 = @line2, City = @city,
        State = @state, Pincode = @pincode, Latitude = @latitude,
        Longitude = @longitude, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @id AND UserId = @userId;
    SELECT * FROM Addresses WHERE Id = @id;
  `;
  return base.executeOne(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
    { name: 'label', type: sql.NVarChar, value: data.label },
    { name: 'line1', type: sql.NVarChar, value: data.line1 },
    { name: 'line2', type: sql.NVarChar, value: data.line2 },
    { name: 'city', type: sql.NVarChar, value: data.city },
    { name: 'state', type: sql.NVarChar, value: data.state },
    { name: 'pincode', type: sql.NVarChar, value: data.pincode },
    { name: 'latitude', type: sql.Float, value: data.latitude },
    { name: 'longitude', type: sql.Float, value: data.longitude },
  ]);
};

exports.deleteById = async (id, userId) => {
  const query = `
    DELETE FROM Addresses WHERE Id = @id AND UserId = @userId
  `;
  return base.execute(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
  ]);
};