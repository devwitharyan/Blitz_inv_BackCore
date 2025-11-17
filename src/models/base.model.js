const { poolConnect } = require('../config/db');

/**
 * Executes a SQL query with parameters.
 * @param {string} query - The SQL query string (e.g., "SELECT * FROM Users WHERE Id = @id")
 * @param {Array} params - An array of parameter objects (e.g., [{ name: 'id', type: sql.UniqueIdentifier, value: userId }])
 * @returns {Promise<Array>} - A promise that resolves to an array of records.
 */
exports.execute = async (query, params = []) => {
  try {
    const pool = await poolConnect;

    const request = pool.request();

    if (params) {
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });
    }

    const result = await request.query(query);
    return result.recordset || [];
    
  } catch (err) {
    console.error('❌ DB Error in base.model:', err.message);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error('Database query failed');
  }
};

/**
 * Executes a query and returns the first result, or null.
 * @param {string} query - The SQL query string.
 * @param {Array} params - An array of parameter objects.
 * @returns {Promise<Object|null>} - A promise that resolves to a single record or null.
 */
exports.executeOne = async (query, params = []) => {
  const results = await this.execute(query, params);
  return results[0] || null;
};