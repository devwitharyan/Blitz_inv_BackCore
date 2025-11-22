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

exports.exists = async (bookingId, serviceId) => {
  const query = `
    SELECT TOP 1 1 
    FROM Reviews 
    WHERE BookingId = @bookingId AND ServiceId = @serviceId
  `;
  const result = await base.executeOne(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId },
    { name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId }
  ]);
  return !!result;
};

// UPDATED: Fetch Customer Name & Image
exports.listByProvider = async (providerId) => {
  const query = `
    SELECT R.*, 
           U.Name AS CustomerName,
           (
             SELECT TOP 1 Id 
             FROM MediaFiles 
             WHERE EntityId = U.Id AND MediaType = 'profile' 
             ORDER BY CreatedAt DESC
           ) AS CustomerImage
    FROM Reviews R
    JOIN Users U ON R.CustomerId = U.Id
    WHERE R.ProviderId = @providerId
    ORDER BY R.CreatedAt DESC
  `;
  return base.execute(query, [{ name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]);
};

exports.listByService = async (serviceId) => {
  const query = `SELECT * FROM Reviews WHERE ServiceId = @serviceId`;
  return base.execute(query, [{ name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId }]);
};