const { sql } = require('../config/db');
const base = require('./base.model');

exports.create = async (data) => {
  const { bookingId, customerId, providerId, amount, paymentProvider } = data;
  const query = `
    INSERT INTO Payments (BookingId, CustomerId, ProviderId, Amount, Status, PaymentProvider)
    OUTPUT INSERTED.*
    VALUES (@bookingId, @customerId, @providerId, @amount, 'success', @paymentProvider)
  `;
  return base.executeOne(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId },
    { name: 'customerId', type: sql.UniqueIdentifier, value: customerId },
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'amount', type: sql.Decimal(18, 2), value: amount },
    { name: 'paymentProvider', type: sql.NVarChar, value: paymentProvider },
  ]);
};

exports.isPaid = async (bookingId) => {
  const query = `
    SELECT TOP 1 1 
    FROM Payments 
    WHERE BookingId = @bookingId AND Status = 'success'
  `;
  const result = await base.executeOne(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId }
  ]);
  return !!result; 
};

exports.findByBookingId = async (bookingId) => {
  const query = `SELECT * FROM Payments WHERE BookingId = @bookingId`;
  return base.executeOne(query, [{ name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId }]);
};

exports.listByUser = async (userId) => {
  const query = `
    SELECT * FROM Payments
    WHERE CustomerId = @userId OR ProviderId = @userId
    ORDER BY CreatedAt DESC
  `;
  return base.execute(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.listAll = async () => {
  const query = `SELECT * FROM Payments ORDER BY CreatedAt DESC`;
  return base.execute(query);
};