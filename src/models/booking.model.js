const { sql, poolConnect } = require('../config/db');
const base = require('./base.model');

exports.create = async (data) => {
  const { customerId, addressId, scheduledAt, services, providerId } = data;

  const totalPrice = services.reduce((sum, svc) => {
    return sum + (parseFloat(svc.price) || 0);
  }, 0);

  const pool = await poolConnect;
  
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    request.input('customerId', sql.UniqueIdentifier, customerId);
    request.input('addressId', sql.UniqueIdentifier, addressId);
    request.input('scheduledAt', sql.DateTime2, scheduledAt);
    request.input('totalPrice', sql.Decimal(18, 2), totalPrice);
    request.input('providerId', sql.UniqueIdentifier, providerId || null);

    const bookingQuery = `
      INSERT INTO Bookings (CustomerId, AddressId, ScheduledAt, Status, Price, ProviderId)
      OUTPUT INSERTED.Id AS BookingId
      VALUES (@customerId, @addressId, @scheduledAt, 'pending', @totalPrice, @providerId)
    `;
    
    const bookingResult = await request.query(bookingQuery);
    const bookingId = bookingResult.recordset[0].BookingId;

    for (const svc of services) {
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
    await transaction.rollback();
    console.error("❌ Transaction Error in createBooking:", err);
    throw new Error("Booking creation failed. Please try again.");
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
  const query = `
    SELECT B.*, A.City, A.Line1,
    (A.GeoLocation.STDistance(geography::Point(@lat, @long, 4326)) / 1000) AS Distance
    FROM Bookings B
    JOIN Addresses A ON B.AddressId = A.Id
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
  const query = `SELECT * FROM Bookings ${condition} ORDER BY CreatedAt DESC`;
  return base.execute(query, [{ name: 'userId', type: sql.UniqueIdentifier, value: userId }]);
};

exports.findById = async (id) => {
  const query = `SELECT * FROM Bookings WHERE Id = @id`;
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