const { sql, poolConnect } = require('../config/db');
const base = require('./base.model');

exports.create = async (userId) => {
  const query = `
    INSERT INTO Providers (UserId, VerificationStatus)
    OUTPUT INSERTED.*
    VALUES (@userId, 'Pending')
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId }
  ]);
};

exports.findByUserId = async (userId) => {
  const query = `SELECT * FROM Providers WHERE UserId = @userId`;
  return base.executeOne(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.findById = async (id) => {
  const query = `SELECT * FROM Providers WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};

exports.updateByUserId = async (userId, data) => {
  const { bio, experienceYears } = data;
  const query = `
    UPDATE Providers
    SET Bio = @bio, ExperienceYears = @experienceYears, UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @userId;
    SELECT * FROM Providers WHERE UserId = @userId
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
    { name: 'bio', type: sql.NVarChar, value: bio },
    { name: 'experienceYears', type: sql.Int, value: experienceYears },
  ]);
};

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
  const { aadharNo, panNo } = data;
  const query = `
    UPDATE Providers
    SET AadharNo = @aadharNo, PanNo = @panNo, UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @userId;
    SELECT * FROM Providers WHERE UserId = @userId
  `;
  return base.executeOne(query, [
    { name: 'userId', type: sql.UniqueIdentifier, value: userId },
    { name: 'aadharNo', type: sql.NVarChar, value: aadharNo },
    { name: 'panNo', type: sql.NVarChar, value: panNo },
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
    SELECT P.*, Dist.Distance
    FROM Providers P
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