// require('dotenv').config();

// module.exports = {
//   jwtSecret: process.env.JWT_SECRET || 'SuperSecretKey', // Fallback for development
//   dbConfig: {
//     user: process.env.DB_USER || 'blitz_db_user',
//     password: process.env.DB_PASSWORD || 'dbuser123',
//     server: process.env.DB_SERVER || 'localhost',
//     database: process.env.DB_NAME || 'HomeServiceDB',
//     options: {
//       encrypt: true,
//       trustServerCertificate: true,
//     },
//   },
// };
require('dotenv').config();

const requiredEnvs = [
  'JWT_SECRET',
  'DB_USER',
  'DB_PASS',  // Matching your .env (was DB_PASSWORD)
  'DB_HOST',  // Matching your .env (was DB_SERVER)
  'DB_NAME'
];

// 2. Validation: Check if any keys are missing
const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

if (missingEnvs.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  dbConfig: {
    user: process.env.DB_USER,
    password: process.env.DB_PASS, 
    server: process.env.DB_HOST,   
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433, 
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true', 
      trustServerCertificate: true,
    },
  },
};