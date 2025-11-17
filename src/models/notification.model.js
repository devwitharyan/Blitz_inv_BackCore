const { sql } = require('../config/db');
const base = require('./base.model');

exports.listByUser = async (userId) => {
  const query = `SELECT * FROM Notifications WHERE UserId = @userId ORDER BY CreatedAt DESC`;
  return base.execute(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.markAsRead = async (id) => {
  const query = `
    UPDATE Notifications SET IsRead = 1 WHERE Id = @id;
    SELECT * FROM Notifications WHERE Id = @id
  `;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};
