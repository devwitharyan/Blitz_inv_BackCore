const { sql } = require('../config/db');
const base = require('./base.model');

// Create profile linked to User
exports.create = async (userId) => {
  const query = `
    INSERT INTO Providers (UserId, VerificationStatus, Credits)
    OUTPUT INSERTED.*
    VALUES (@userId, 'Pending', 0)
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId }
  ]);
};

// Find by User ID (with Rating)
exports.findByUserId = async (userId) => {
  const query = `
    SELECT P.*,
           (
             SELECT ISNULL(AVG(CAST(Rating AS FLOAT)), 0) 
             FROM Reviews 
             WHERE ProviderId = P.Id
           ) AS AverageRating
    FROM Providers P 
    WHERE UserId = @userId
  `;
  return base.executeOne(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.findById = async (id) => {
  const query = `SELECT * FROM Providers WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};

exports.updateByUserId = async (userId, data) => {
  const { bio, experienceYears, gender, age, birthdate, aadharNo, panNo } = data;

  const params = [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }];
  const setClauses = [];

  if (bio !== undefined) {
    setClauses.push('Bio = @bio');
    params.push({ name: 'bio', type: sql.NVarChar, value: bio });
  }
  if (experienceYears !== undefined) {
    setClauses.push('ExperienceYears = @experienceYears');
    params.push({ name: 'experienceYears', type: sql.Int, value: experienceYears });
  }
  if (gender !== undefined) {
    setClauses.push('Gender = @gender');
    params.push({ name: 'gender', type: sql.NVarChar, value: gender });
  }
  if (age !== undefined) {
    setClauses.push('Age = @age');
    params.push({ name: 'age', type: sql.Int, value: age });
  }
  if (birthdate !== undefined) {
    setClauses.push('Birthdate = @birthdate');
    params.push({ name: 'birthdate', type: sql.Date, value: birthdate || null });
  }
  if (aadharNo !== undefined) {
    setClauses.push('AadharNo = @aadharNo');
    params.push({ name: 'aadharNo', type: sql.NVarChar, value: aadharNo });
  }
  if (panNo !== undefined) {
    setClauses.push('PanNo = @panNo');
    params.push({ name: 'panNo', type: sql.NVarChar, value: panNo });
  }

  setClauses.push('UpdatedAt = SYSUTCDATETIME()');

  if (setClauses.length === 1) { 
    return this.findByUserId(userId); 
  }

  const query = `
    UPDATE Providers
    SET ${setClauses.join(', ')}
    WHERE UserId = @userId;
    
    SELECT * FROM Providers WHERE UserId = @userId
  `;
  
  return base.executeOne(query, params);
};

// --- MANAGE SERVICES ---
exports.addService = async (providerId, serviceId, customPrice) => {
  const query = `
    IF NOT EXISTS (SELECT 1 FROM ProviderServices WHERE ProviderId = @providerId AND ServiceId = @serviceId)
    BEGIN
        INSERT INTO ProviderServices (ProviderId, ServiceId, CustomPrice)
        OUTPUT INSERTED.*
        VALUES (@providerId, @serviceId, @customPrice)
    END
  `;
  return base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId },
    { name: 'customPrice', type: sql.Decimal(18, 2), value: customPrice || null },
  ]);
};

exports.removeService = async (providerId, serviceId) => {
  const query = `DELETE FROM ProviderServices WHERE ProviderId = @providerId AND ServiceId = @serviceId`;
  return base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'serviceId', type: sql.UniqueIdentifier, value: serviceId },
  ]);
};

exports.getMyServices = async (providerId) => {
  const query = `
    SELECT PS.*, S.Name, S.Description, S.BasePrice 
    FROM ProviderServices PS
    JOIN Services S ON PS.ServiceId = S.Id
    WHERE PS.ProviderId = @providerId
  `;
  return base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
  ]);
};

exports.submitVerification = async (userId, data) => {
  const { aadharNo, panNo, bankAccountNo, ifscCode } = data;
  const query = `
    UPDATE Providers
    SET AadharNo = @aadharNo, 
        PanNo = @panNo, 
        BankAccountNo = @bankAccountNo,
        IfscCode = @ifscCode,
        VerificationStatus = 'Pending', 
        UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @userId;
    
    SELECT * FROM Providers WHERE UserId = @userId
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
    { name: 'aadharNo', type: sql.NVarChar, value: aadharNo },
    { name: 'panNo', type: sql.NVarChar, value: panNo },
    { name: 'bankAccountNo', type: sql.NVarChar, value: bankAccountNo },
    { name: 'ifscCode', type: sql.NVarChar, value: ifscCode },
  ]);
};

exports.verify = async (id, status) => {
  const query = `
    UPDATE Providers
    SET VerificationStatus = @status, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @id;
    SELECT * FROM Providers WHERE Id = @id
  `;
  return base.executeOne(query, [
    { name: 'id', type: sql.UniqueIdentifier, value: id },
    { name: 'status', type: sql.NVarChar, value: status }
  ]);
};

exports.listAll = async (lat, long, status) => {
  let query = `
    SELECT P.*, U.Name, U.Email, U.Mobile, U.FcmToken, Dist.Distance
    FROM Providers P
    JOIN Users U ON P.UserId = U.Id
  `;
  if (lat && long) {
    query += `
      CROSS APPLY (
        SELECT TOP 1 GeoLocation 
        FROM Addresses A 
        WHERE A.UserId = P.UserId AND A.GeoLocation IS NOT NULL
      ) AS Addr
      CROSS APPLY (
        SELECT (Addr.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) / 1000) AS Distance
      ) AS Dist
    `;
  } else {
    query += ` CROSS APPLY (SELECT NULL AS Distance) AS Dist `;
  }

  let whereClause = ' WHERE 1=1 ';
  const params = [];

  if (status) {
    whereClause += ` AND P.VerificationStatus = @status`;
    params.push({ name: 'status', type: sql.NVarChar, value: status });
  }

  query += whereClause;

  if (lat && long) {
    query += ` ORDER BY Dist.Distance ASC`;
    params.push({ name: 'lat', type: sql.Float, value: lat });
    params.push({ name: 'long', type: sql.Float, value: long });
  } else {
    query += ` ORDER BY P.CreatedAt DESC`;
  }

  return base.execute(query, params);
};

exports.findNearest = async (lat, long) => {
  const query = `
    SELECT TOP 1 P.*, (A.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) / 1000) AS Distance
    FROM Providers P
    CROSS APPLY (
        SELECT TOP 1 GeoLocation 
        FROM Addresses A 
        WHERE A.UserId = P.UserId AND A.GeoLocation IS NOT NULL
    ) AS A
    WHERE P.VerificationStatus = 'Verified'
    ORDER BY A.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) ASC
  `;
  return base.executeOne(query, [
    { name: 'lat', type: sql.Float, value: lat },
    { name: 'long', type: sql.Float, value: long }
  ]);
};

exports.getCredits = async (providerId) => {
  const query = `SELECT Credits FROM Providers WHERE Id = @providerId`;
  const result = await base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }
  ]);
  return result ? result.Credits : 0;
};

exports.topUpCredits = async (providerId, amount, referenceId) => {
  const query = `
    BEGIN TRANSACTION;
      INSERT INTO CreditTransactions (ProviderId, Amount, Type, ReferenceId, Description)
      VALUES (@providerId, @amount, 'TOPUP', @referenceId, 'Wallet Top-up');

      UPDATE Providers 
      SET Credits = Credits + @amount, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @providerId;
    COMMIT;
    SELECT Credits FROM Providers WHERE Id = @providerId;
  `;
  return base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'amount', type: sql.Int, value: amount },
    { name: 'referenceId', type: sql.NVarChar, value: referenceId || null } 
  ]);
};

exports.deductCredits = async (providerId, amount, bookingId) => {
  const query = `
    DECLARE @CurrentCredits INT;
    SELECT @CurrentCredits = Credits FROM Providers WHERE Id = @providerId;

    IF @CurrentCredits >= @amount
    BEGIN
        BEGIN TRANSACTION;
            INSERT INTO CreditTransactions (ProviderId, Amount, Type, ReferenceId, Description)
            VALUES (@providerId, -@amount, 'JOB_FEE', @bookingId, 'Fee for accepting job');

            UPDATE Providers 
            SET Credits = Credits - @amount, UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @providerId;
        COMMIT;
        SELECT 1 AS Success, (Credits) AS NewBalance FROM Providers WHERE Id = @providerId;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, @CurrentCredits AS NewBalance;
    END
  `;
  
  const result = await base.executeOne(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId },
    { name: 'amount', type: sql.Int, value: amount },
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId }
  ]);

  if (!result || result.Success === 0) {
    throw new Error(`Insufficient credits. Balance: ${result ? result.NewBalance : 0}`);
  }
  return result.NewBalance;
};