const { sql } = require('../config/db');
const base = require('./base.model');

// --- ADDED THIS FUNCTION ---
exports.create = async (userId) => {
  const query = `
    INSERT INTO Customers (UserId)
    OUTPUT INSERTED.*
    VALUES (@userId)
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId }
  ]);
};
// --- END ---

exports.findByUserId = async (userId) => {
  const query = `SELECT * FROM Customers WHERE UserId = @userId`;
  return base.executeOne(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.updateByUserId = async (userId, data) => {
  const { birthdate, gender } = data;
  const query = `
    UPDATE Customers
    SET Birthdate = @birthdate, Gender = @gender, UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @userId
    SELECT * FROM Customers WHERE UserId = @userId
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
    { name: 'birthdate', type: sql.Date, value: birthdate },
    { name: 'gender', type: sql.NVarChar, value: gender },
  ]);
};

exports.findById = async (id) => {
  const query = `SELECT * FROM Customers WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};