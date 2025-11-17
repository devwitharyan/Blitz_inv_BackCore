const { sql } = require('../config/db');
const base = require('./base.model');

exports.createRequest = async (data) => {
  const { providerId, amount } = data;
  const query = `
    INSERT INTO PayoutRequests (ProviderId, Amount)
    OUTPUT INSERTED.*
    VALUES (@providerId, @amount)
  `;
  return base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'amount', type: sql.Decimal(18, 2), value: amount },
  ]);
};

exports.list = async (providerId) => {
  const query = providerId
    ? `SELECT * FROM PayoutRequests WHERE ProviderId = @providerId ORDER BY CreatedAt DESC`
    : `SELECT * FROM PayoutRequests ORDER BY CreatedAt DESC`;
  const params = providerId
    ? [{ name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]
    : [];
  return base.execute(query, params);
};

exports.updateStatus = async (id, status) => {
  const query = `
    UPDATE PayoutRequests SET Status = @status WHERE Id = @id;
    SELECT * FROM PayoutRequests WHERE Id = @id
  `;
  return base.executeOne(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
    { name: 'status', type: sql.NVarChar, value: status },
  ]);
};

exports.listEarningsByProvider = async (providerId) => {
  const query = `
    SELECT * FROM ProviderEarnings WHERE ProviderId = @providerId ORDER BY CreatedAt DESC
  `;
  return base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
  ]);
};

exports.addTransaction = async ({ providerId, bookingId, amount, type }) => {
  const query = `
    INSERT INTO ProviderEarnings (ProviderId, BookingId, Amount, Type)
    VALUES (@providerId, @bookingId, @amount, @type)
  `;
  return base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId },
    { name: 'amount', type: sql.Decimal(18, 2), value: amount },
    { name: 'type', type: sql.NVarChar, value: type },
  ]);
};