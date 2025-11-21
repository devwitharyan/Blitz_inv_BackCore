const { sql, poolConnect } = require('../config/db');
const base = require('./base.model');

exports.create = async (data) => {
  const { customerId, addressId, scheduledAt, services, providerId } = data;

  const pool = await poolConnect; 
  
  const transaction = new sql.Transaction(pool);

  try {
    let calculatedTotalPrice = 0;
    const validatedServices = [];

    for (const svcItem of services) {
      let priceQuery = `SELECT BasePrice FROM Services WHERE Id = @serviceId`;
      
      let request = new sql.Request(pool); 
      request.input('serviceId', sql.UniqueIdentifier, svcItem.serviceId);
      
      let priceResult = await request.query(priceQuery);
      let actualPrice = priceResult.recordset[0]?.BasePrice;

      if (actualPrice === undefined) {
        throw new Error(`Invalid Service ID: ${svcItem.serviceId}`);
      }

      if (providerId) {
         const customPriceQuery = `
            SELECT CustomPrice FROM ProviderServices 
            WHERE ProviderId = @providerId AND ServiceId = @serviceId
         `;
         const customRequest = new sql.Request(pool);
         customRequest.input('providerId', sql.UniqueIdentifier, providerId);
         customRequest.input('serviceId', sql.UniqueIdentifier, svcItem.serviceId);
         
         const customResult = await customRequest.query(customPriceQuery);
         if (customResult.recordset.length > 0 && customResult.recordset[0].CustomPrice !== null) {
             actualPrice = customResult.recordset[0].CustomPrice;
         }
      }

      actualPrice = parseFloat(actualPrice);
      calculatedTotalPrice += actualPrice;
      
      validatedServices.push({
          serviceId: svcItem.serviceId,
          price: actualPrice
      });
    }

    await transaction.begin();
    
    const request = new sql.Request(transaction);

    request.input('customerId', sql.UniqueIdentifier, customerId);
    request.input('addressId', sql.UniqueIdentifier, addressId);
    request.input('scheduledAt', sql.DateTime2, scheduledAt);
    request.input('totalPrice', sql.Decimal(18, 2), calculatedTotalPrice);
    request.input('providerId', sql.UniqueIdentifier, providerId || null);

    const bookingQuery = `
      INSERT INTO Bookings (CustomerId, AddressId, ScheduledAt, Status, Price, ProviderId)
      OUTPUT INSERTED.Id AS BookingId
      VALUES (@customerId, @addressId, @scheduledAt, 'pending', @totalPrice, @providerId)
    `;
    
    const bookingResult = await request.query(bookingQuery);
    const bookingId = bookingResult.recordset[0].BookingId;

    for (const svc of validatedServices) {
      const svcRequest = new sql.Request(transaction); 
      svcRequest.input('bookingId', sql.UniqueIdentifier, bookingId);
      svcRequest.input('serviceId', sql.UniqueIdentifier, svc.serviceId);
      svcRequest.input('price', sql.Decimal(18, 2), svc.price);

      const serviceQuery = `
        INSERT INTO BookingServices (BookingId, ServiceId, Price)
        VALUES (@bookingId, @serviceId, @price)
      `;
      await svcRequest.query(serviceQuery);
    }

    await transaction.commit();

    return this.findById(bookingId);

  } catch (err) {
    if (transaction._begun) await transaction.rollback();
    console.error("❌ Transaction Error in createBooking:", err);
    throw new Error(err.message || "Booking creation failed.");
  }
};

exports.hasPreviousRelation = async (customerId, providerId) => {
  const query = `
    SELECT TOP 1 1 
    FROM Bookings 
    WHERE CustomerId = @customerId 
      AND ProviderId = @providerId 
      AND Status = 'completed'
  `;
  const result = await base.executeOne(query, [
    { name: 'customerId', type: sql.UniqueIdentifier, value: customerId },
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }
  ]);
  return !!result;
};

exports.findNearbyPending = async (lat, long, radiusKm = 5) => {
  // UPDATED: REMOVED U.Mobile and U.Email for privacy on pending jobs
  const query = `
    SELECT B.*, 
           A.City, A.Line1, A.Latitude, A.Longitude,
           U.Name AS CustomerName,
           (
             SELECT TOP 1 Id 
             FROM MediaFiles 
             WHERE EntityId = U.Id AND MediaType = 'profile' 
             ORDER BY CreatedAt DESC
           ) AS ProfileImageId,
           (A.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) / 1000) AS Distance,
           SvcData.ServiceName,
           SvcData.CategoryName
    FROM Bookings B
    JOIN Addresses A ON B.AddressId = A.Id
    JOIN Users U ON B.CustomerId = U.Id
    CROSS APPLY (
        SELECT TOP 1 S.Name AS ServiceName, SC.Name AS CategoryName
        FROM BookingServices BS
        JOIN Services S ON BS.ServiceId = S.Id
        LEFT JOIN ServiceCategories SC ON S.CategoryId = SC.Id
        WHERE BS.BookingId = B.Id
    ) AS SvcData
    WHERE B.Status = 'pending' 
      AND B.ProviderId IS NULL
      AND A.GeoLocation IS NOT NULL
      AND (A.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) / 1000) <= @radius
    ORDER BY Distance ASC
  `;
  return base.execute(query, [
    { name: 'lat', type: sql.Float, value: lat },
    { name: 'long', type: sql.Float, value: long },
    { name: 'radius', type: sql.Int, value: radiusKm }
  ]);
};

exports.claim = async (bookingId, providerId) => {
  const query = `
    UPDATE Bookings
    SET ProviderId = @providerId, Status = 'accepted', UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @bookingId AND ProviderId IS NULL;
    
    SELECT * FROM Bookings WHERE Id = @bookingId;
  `;
  return base.executeOne(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId },
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }
  ]);
};

exports.listForUser = async (userId, role) => {
  if (role === 'admin') return base.execute('SELECT * FROM Bookings ORDER BY CreatedAt DESC');
  
  const condition = role === 'provider' ? `WHERE ProviderId = @userId` : `WHERE CustomerId = @userId`;

  // KEEP Contact details here for "My Jobs"
  const query = `
    SELECT B.*, 
           U.Name AS CustomerName, 
           U.Mobile AS CustomerPhone,
           U.Email AS CustomerEmail,
           (SELECT TOP 1 Id FROM MediaFiles WHERE EntityId = U.Id AND MediaType = 'profile' ORDER BY CreatedAt DESC) AS ProfileImageId,
           A.Line1, A.City, A.Latitude, A.Longitude,
           Svc.Name AS ServiceName,
           SC.Name AS CategoryName
    FROM Bookings B
    JOIN Addresses A ON B.AddressId = A.Id
    JOIN Users U ON B.CustomerId = U.Id
    OUTER APPLY (
        SELECT TOP 1 S.Name, S.CategoryId
        FROM BookingServices BS 
        JOIN Services S ON BS.ServiceId = S.Id 
        WHERE BS.BookingId = B.Id
    ) AS Svc
    LEFT JOIN ServiceCategories SC ON Svc.CategoryId = SC.Id
    ${condition} 
    ORDER BY CreatedAt DESC
  `;
  return base.execute(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.findById = async (id) => {
  const query = `
    SELECT B.*, A.Line1, A.City, A.Latitude, A.Longitude, 
           U.Name AS CustomerName,
           U.Mobile AS CustomerPhone,
           U.Email AS CustomerEmail,
           (SELECT TOP 1 Id FROM MediaFiles WHERE EntityId = U.Id AND MediaType = 'profile' ORDER BY CreatedAt DESC) AS ProfileImageId,
           Svc.Name AS ServiceName,
           SC.Name AS CategoryName
    FROM Bookings B
    JOIN Addresses A ON B.AddressId = A.Id
    JOIN Users U ON B.CustomerId = U.Id
    OUTER APPLY (
        SELECT TOP 1 S.Name, S.CategoryId 
        FROM BookingServices BS 
        JOIN Services S ON BS.ServiceId = S.Id 
        WHERE BS.BookingId = B.Id
    ) AS Svc
    LEFT JOIN ServiceCategories SC ON Svc.CategoryId = SC.Id
    WHERE B.Id = @id
  `;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
};

exports.updateStatus = async (id, status) => {
  const query = `UPDATE Bookings SET Status = @status WHERE Id = @id; SELECT * FROM Bookings WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }, { name: 'status', type: sql.NVarChar, value: status }]);
};

exports.assignProvider = async (id, providerId) => {
  const query = `UPDATE Bookings SET ProviderId = @providerId WHERE Id = @id`;
  return base.executeOne(query, [{ name: 'id', type: sql.UniqueIdentifier, value: id }, { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }]);
};

exports.getStats = async () => {
  const query = `
    SELECT 
        COUNT(Id) AS TotalBookings,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS CompletedBookings
    FROM Bookings;
  `;
  return base.executeOne(query);
};

exports.getServicesByBookingId = async (bookingId) => {
  const query = `
    SELECT 
      BS.ServiceId, 
      BS.Price, 
      S.Name AS ServiceName 
    FROM BookingServices BS
    JOIN Services S ON BS.ServiceId = S.Id
    WHERE BS.BookingId = @bookingId
  `;
  return base.execute(query, [
    { name: 'bookingId', type: sql.UniqueIdentifier, value: bookingId }
  ]);
};

exports.getRecentClients = async (providerId) => {
  const query = `
    SELECT DISTINCT TOP 10 
        U.Id, 
        U.Name, 
        U.Email, 
        U.Mobile, 
        MAX(B.CreatedAt) as LastBookingDate
    FROM Bookings B
    JOIN Users U ON B.CustomerId = U.Id
    WHERE B.ProviderId = @providerId AND B.Status = 'completed'
    GROUP BY U.Id, U.Name, U.Email, U.Mobile
    ORDER BY LastBookingDate DESC
  `;
  return base.execute(query, [
    { name: 'providerId', type: sql.UniqueIdentifier, value: providerId }
  ]);
};