const { sql } = require('../config/db');
const base = require('./base.model');

exports.logAction = async (adminId, action) => {
  if (!adminId) {
    console.error("Attempted to log action without adminId:", action);
    throw new Error("Admin ID is required for logging.");
  }
  const query = `
    INSERT INTO AdminLogs (AdminId, Action)
    VALUES (@adminId, @action)
  `;
  try {
    await base.execute(query, [
      { name: 'adminId', type: sql.UniqueIdentifier, value: adminId },
      { name: 'action', type: sql.NVarChar, value: action },
    ]);
  } catch (err) {
    console.error("❌ DB Error in logAction:", err.message);
    throw new Error("Database logging failed.");
  }
};

exports.listLogs = async () => {
  const query = `SELECT * FROM AdminLogs ORDER BY CreatedAt DESC`;
  return base.execute(query);
};