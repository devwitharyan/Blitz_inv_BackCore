const { sql } = require('../config/db');
const base = require('./base.model');

exports.create = async (data) => {
  const { bookingId, serviceId, customerId, providerId, rating, comment } = data;
  const query = `
    INSERT INTO Reviews (BookingId, ServiceId, CustomerId, ProviderId, Rating, Comment)
    OUTPUT INSERTED.*
    VALUES (@bookingId, @serviceId, @customerId, @providerId, @rating, @comment)
  `;
  return base.executeOne(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId },
    { name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId },
    { name: 'customerId', type: sql.UniqueIdentifier, value: customerId },
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'rating', type: sql.Int, value: rating },
    { name: 'comment', type: sql.NVarChar, value: comment },
  ]);
};

exports.listByProvider = async (providerId) => {
  const query = `SELECT * FROM Reviews WHERE ProviderId = @providerId`;
  return base.execute(query, [{ name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]);
};

exports.listByService = async (serviceId) => {
  const query = `SELECT * FROM Reviews WHERE ServiceId = @serviceId`;
  return base.execute(query, [{ name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId }]);
};
