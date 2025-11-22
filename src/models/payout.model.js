const { sql } = require('../config/db');
const base = require('./base.model');

exports.createRequest = async (data) => {
  const { providerId, amount } = data;
  
  const query = `
    DECLARE @AvailableBalance DECIMAL(18, 2);
    
    SELECT @AvailableBalance = 
        ISNULL((SELECT SUM(Amount) FROM ProviderEarnings WHERE ProviderId = @providerId), 0)
        -
        ISNULL((SELECT SUM(Amount) FROM PayoutRequests WHERE ProviderId = @providerId AND Status != 'rejected'), 0);

    IF @AvailableBalance >= @amount
    BEGIN
        INSERT INTO PayoutRequests (ProviderId, Amount, Status)
        OUTPUT INSERTED.*
        VALUES (@providerId, @amount, 'pending');
    END
  `;

  return base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'amount', type: sql.Decimal(18, 2), value: amount },
  ]);
};

// --- NEW: Unified Wallet Data Fetcher ---
exports.getWalletDetails = async (providerId) => {
  // 1. Calculate Aggregates
  const summaryQuery = `
    SELECT
        ISNULL((SELECT SUM(Amount) FROM ProviderEarnings WHERE ProviderId = @providerId), 0) AS TotalEarned,
        ISNULL((SELECT SUM(Amount) FROM PayoutRequests WHERE ProviderId = @providerId AND Status != 'rejected'), 0) AS TotalWithdrawn
  `;
  const summary = await base.executeOne(summaryQuery, [{ name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]);

  const balance = summary.TotalEarned - summary.TotalWithdrawn;

  // 2. Fetch Unified History (Earnings + Withdrawals)
  const historyQuery = `
    SELECT Id, Amount, 'Earning' AS Type, 'Job Payment' AS Description, CreatedAt, 'completed' AS Status
    FROM ProviderEarnings
    WHERE ProviderId = @providerId

    UNION ALL

    SELECT Id, Amount, 'Withdrawal' AS Type, 'Payout Request' AS Description, CreatedAt, Status
    FROM PayoutRequests
    WHERE ProviderId = @providerId

    ORDER BY CreatedAt DESC
  `;
  
  const history = await base.execute(historyQuery, [{ name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]);

  return {
    balance: balance,
    totalEarned: summary.TotalEarned,
    totalWithdrawn: summary.TotalWithdrawn,
    history: history
  };
};

// ... (Keep other existing methods like list, updateStatus if needed for admin) ...
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