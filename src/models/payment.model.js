const { sql, poolConnect } = require('../config/db');
const base = require('./base.model');

// Check if a booking is already paid
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

// --- NEW: ATOMIC TRANSACTION FOR SECURE PAYMENTS ---
exports.completePaymentTransaction = async ({ bookingId, customerId, providerId, amount, paymentProvider, transactionId }) => {
  const pool = await poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    // 1. Insert Payment Record
    request.input('bookingId', sql.UniqueIdentifier, bookingId);
    request.input('customerId', sql.UniqueIdentifier, customerId);
    request.input('providerId', sql.UniqueIdentifier, providerId);
    request.input('amount', sql.Decimal(18, 2), amount);
    request.input('paymentProvider', sql.NVarChar, paymentProvider);
    request.input('transactionId', sql.NVarChar, transactionId); // Store Razorpay Payment ID

    const paymentQuery = `
      INSERT INTO Payments (BookingId, CustomerId, ProviderId, Amount, Status, PaymentProvider)
      OUTPUT INSERTED.*
      VALUES (@bookingId, @customerId, @providerId, @amount, 'success', @paymentProvider);
    `;
    const paymentResult = await request.query(paymentQuery);
    const paymentRecord = paymentResult.recordset[0];

    // 2. Add to Provider Earnings (If Provider Exists)
    if (providerId) {
        const earningRequest = new sql.Request(transaction);
        earningRequest.input('providerId', sql.UniqueIdentifier, providerId);
        earningRequest.input('bookingId', sql.UniqueIdentifier, bookingId);
        earningRequest.input('amount', sql.Decimal(18, 2), amount);
        earningRequest.input('type', sql.NVarChar, 'earnings');
        
        const earningQuery = `
            INSERT INTO ProviderEarnings (ProviderId, BookingId, Amount, Type)
            VALUES (@providerId, @bookingId, @amount, @type);
        `;
        await earningRequest.query(earningQuery);
    }

    await transaction.commit();
    return paymentRecord;

  } catch (err) {
    if (transaction._begun) await transaction.rollback();
    console.error("❌ Transaction Error in completePaymentTransaction:", err);
    throw new Error("Payment processing failed. Transaction rolled back.");
  }
};

exports.getRevenueStats = async () => {
    const query = `SELECT ISNULL(SUM(Amount), 0) AS TotalRevenue FROM Payments WHERE Status = 'success';`;
    const result = await base.executeOne(query);
    return result ? result.TotalRevenue : 0;
};