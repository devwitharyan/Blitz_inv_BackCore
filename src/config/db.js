const sql = require('mssql');
const { dbConfig } = require('./env');

const poolConnect = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('💾 Database connection pool created');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed: ', err.message);
  });

module.exports = {
  sql,
  poolConnect,
};
