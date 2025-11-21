const sql = require('mssql');
const { poolConnect } = require('../config/db');
const base = require('./base.model');

// ... existing create/findById methods ...
exports.findByEmailOrMobile = async (email, mobile) => {
    try {
      const pool = await poolConnect;
      const result = await pool.request()
        .input('Email', sql.NVarChar, email)
        .input('Mobile', sql.NVarChar, mobile)
        .query(`SELECT TOP 1 * FROM Users WHERE Email = @Email OR Mobile = @Mobile;`);
      return result.recordset[0] || null;
    } catch (err) { throw new Error("Database query failed"); }
};

exports.findById = async (id) => {
    try {
      const pool = await poolConnect;
      const result = await pool.request()
        .input('Id', sql.UniqueIdentifier, id)
        .query(`SELECT TOP 1 * FROM Users WHERE Id = @Id;`);
      return result.recordset[0] || null;
    } catch (err) { throw new Error("Database query failed"); }
};

exports.create = async (data) => {
    try {
      const pool = await poolConnect;
      await pool.request()
        .input('Id', sql.UniqueIdentifier, data.id)
        .input('Name', sql.NVarChar, data.name)
        .input('Email', sql.NVarChar, data.email)
        .input('Mobile', sql.NVarChar, data.mobile)
        .input('PasswordHash', sql.NVarChar, data.passwordHash)
        .input('Role', sql.NVarChar, data.role)
        .query(`INSERT INTO Users (Id, Name, Email, Mobile, PasswordHash, Role) VALUES (@Id, @Name, @Email, @Mobile, @PasswordHash, @Role);`);
      return data;
    } catch (err) { throw new Error("Database query failed"); }
};

exports.countByRole = async (role, isActive = null) => {
    let query = `SELECT COUNT(Id) AS Count FROM Users WHERE Role = @role`;
    const params = [{ name: 'role', type: sql.NVarChar, value: role }];
    if (isActive !== null) {
        query += ` AND IsActive = @isActive`;
        params.push({ name: 'isActive', type: sql.Bit, value: isActive });
    }
    const result = await base.executeOne(query, params); 
    return result ? result.Count : 0;
};

exports.findAll = async (role, page = 1, limit = 10) => {
  try {
    const pool = await poolConnect;
    const offset = (page - 1) * limit;

    let query = 'SELECT Id, Name, Email, Mobile, Role, IsActive, CreatedAt FROM Users';
    const request = pool.request();

    if (role) {
      query += ` WHERE Role = @Role`;
      request.input('Role', sql.NVarChar, role);
    }

    query += ` ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;
    
    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error("❌ DB Error in findAll:", err.message);
    throw new Error("Database query failed in findAll");
  }
};

exports.getFullProfile = async (id) => {
    try {
        const pool = await poolConnect;
        const userResult = await pool.request().input('Id', sql.UniqueIdentifier, id).query('SELECT * FROM Users WHERE Id = @Id');
        const user = userResult.recordset[0];
        if (!user) return null;
        let profile = null;
        if (user.Role.toLowerCase() === 'provider') { 
          const provResult = await pool.request().input('UserId', sql.UniqueIdentifier, id).query('SELECT * FROM Providers WHERE UserId = @UserId');
          profile = provResult.recordset[0];
        } else if (user.Role.toLowerCase() === 'customer') {
          const custResult = await pool.request().input('UserId', sql.UniqueIdentifier, id).query('SELECT * FROM Customers WHERE UserId = @UserId');
          profile = custResult.recordset[0];
        }
        return { user, profile };
    } catch (err) { throw new Error("Database query failed in getFullProfile"); }
};

exports.updateStatus = async (id, isActive) => {
    try {
      const pool = await poolConnect;
      await pool.request().input('Id', sql.UniqueIdentifier, id).input('IsActive', sql.Bit, isActive ? 1 : 0).query('UPDATE Users SET IsActive = @IsActive WHERE Id = @Id');
      return true;
    } catch (err) { throw new Error("Database query failed in updateStatus"); }
};

exports.updateBasicInfo = async (id, data) => {
    try {
      const pool = await poolConnect;
      await pool.request().input('Id', sql.UniqueIdentifier, id).input('Name', sql.NVarChar, data.name).input('Email', sql.NVarChar, data.email).input('Mobile', sql.NVarChar, data.mobile).query('UPDATE Users SET Name = @Name, Email = @Email, Mobile = @Mobile WHERE Id = @Id');
      return true;
    } catch (err) { throw new Error("Database query failed in updateBasicInfo"); }
};

// NEW: Update FCM Token
exports.updateFcmToken = async (id, token) => {
    const query = `UPDATE Users SET FcmToken = @token WHERE Id = @id`;
    return base.executeOne(query, [
        { name: 'id', type: sql.UniqueIdentifier, value: id },
        { name: 'token', type: sql.NVarChar, value: token }
    ]);
};