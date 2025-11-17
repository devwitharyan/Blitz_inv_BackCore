const { poolConnect } = require('../config/db');

/**
 * Executes a SQL query with parameters.
 * @param {string} query - The SQL query string (e.g., "SELECT * FROM Users WHERE Id = @id")
 * @param {Array} params - An array of parameter objects (e.g., [{ name: 'id', type: sql.UniqueIdentifier, value: userId }])
 * @returns {Promise<Array>} - A promise that resolves to an array of records.
 */
exports.execute = async (query, params = []) => {
  try {
    // 1. Await the connection pool
    const pool = await poolConnect;

    // 2. Create a new request object from the pool
    const request = pool.request();

    // 3. Add all parameters to the request
    if (params) {
      params.forEach(param => {
        // Example: request.input('id', sql.UniqueIdentifier, '...value...')
        request.input(param.name, param.type, param.value);
      });
    }

    // 4. Execute the query
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