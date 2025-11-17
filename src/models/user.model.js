const sql = require('mssql');
const { poolConnect } = require('../config/db');


exports.findByEmailOrMobile = async (email, mobile) => {
  try {
    const pool = await poolConnect;
    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .input('Mobile', sql.NVarChar, mobile)
      .query(`
        SELECT TOP 1 * FROM Users
        WHERE Email = @Email OR Mobile = @Mobile;
      `);

    return result.recordset[0] || null;
  } catch (err) {
    console.error("❌ DB Error in findByEmailOrMobile:", err);
    throw new Error("Database query failed");
  }
};

exports.findById = async (id) => {
  try {
    const pool = await poolConnect;
    const result = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT TOP 1 * FROM Users
        WHERE Id = @Id;
      `);

    return result.recordset[0] || null;
  } catch (err) {
    console.error("❌ DB Error in findById:", err);
    throw new Error("Database query failed");
  }
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
      .query(`
        INSERT INTO Users (Id, Name, Email, Mobile, PasswordHash, Role)
        VALUES (@Id, @Name, @Email, @Mobile, @PasswordHash, @Role);
      `);

    return data; 
  } catch (err) {
    console.error("❌ DB Error in userModel.create:", err);
    throw new Error("Database query failed");
  }
};


exports.findAll = async (role) => {
  try {
    const pool = await poolConnect;
    let query = 'SELECT Id, Name, Email, Mobile, Role, IsActive, CreatedAt FROM Users';
    
    if (role) {
      query += ` WHERE Role = @Role`;
      const result = await pool.request()
        .input('Role', sql.NVarChar, role)
        .query(query + ' ORDER BY CreatedAt DESC');
      return result.recordset;
    }

    const result = await pool.request().query(query + ' ORDER BY CreatedAt DESC');
    return result.recordset;
  } catch (err) {
    console.error("❌ DB Error in findAll:", err.message);
    throw new Error("Database query failed in findAll");
  }
};

exports.getFullProfile = async (id) => {
  try {
    const pool = await poolConnect;
    
    // 1. Get User
    const userResult = await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM Users WHERE Id = @Id');
    
    const user = userResult.recordset[0];
    if (!user) return null;

    let profile = null;
    if (user.Role === 'provider') { 
      const provResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .query('SELECT * FROM Providers WHERE UserId = @UserId');
      profile = provResult.recordset[0];
    } else if (user.Role === 'customer') {
      const custResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, id)
        .query('SELECT * FROM Customers WHERE UserId = @UserId');
      profile = custResult.recordset[0];
    }

    return { user, profile };
  } catch (err) {
    console.error("❌ DB Error in getFullProfile:", err.message);
    throw new Error("Database query failed in getFullProfile");
  }
};

exports.updateStatus = async (id, isActive) => {
  try {
    const pool = await poolConnect;
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('IsActive', sql.Bit, isActive ? 1 : 0)
      .query('UPDATE Users SET IsActive = @IsActive WHERE Id = @Id');
    return true;
  } catch (err) {
    console.error("❌ DB Error in updateStatus:", err.message);
    throw new Error("Database query failed in updateStatus");
  }
};

exports.updateBasicInfo = async (id, data) => {
  try {
    const pool = await poolConnect;
    await pool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('Name', sql.NVarChar, data.name)
      .input('Email', sql.NVarChar, data.email)
      .input('Mobile', sql.NVarChar, data.mobile)
      .query('UPDATE Users SET Name = @Name, Email = @Email, Mobile = @Mobile WHERE Id = @Id');
    return true;
  } catch (err) {
    console.error("❌ DB Error in updateBasicInfo:", err.message);
    throw new Error("Database query failed in updateBasicInfo");
  }
};