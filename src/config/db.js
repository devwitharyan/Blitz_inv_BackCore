const sql = require('mssql');
const { dbConfig } = require('./env');

// OPTIMIZATION: Adjust pool settings for Production/Scale
const optimizedConfig = {
  ...dbConfig,
  pool: {
    max: 50, // Increase max connections (Default is 10). Handles ~10k users better.
    min: 5,  // Keep at least 5 connections open to reduce startup latency
    idleTimeoutMillis: 30000, // Close idle connections after 30s
  }
};

const poolConnect = new sql.ConnectionPool(optimizedConfig)
  .connect()
  .then(pool => {
    console.log('💾 Database connection pool established (Max: 50)');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed: ', err.message);
    process.exit(1); // Exit process on DB failure to let PM2 restart it
  });

module.exports = {
  sql,
  poolConnect,
};