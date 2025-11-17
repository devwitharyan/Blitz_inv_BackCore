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

// 1. List of keys that MUST exist in your .env file
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
    password: process.env.DB_PASS, // Maps 'DB_PASS' from .env to 'password' for the DB driver
    server: process.env.DB_HOST,   // Maps 'DB_HOST' from .env to 'server'
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433, // Optional: added port support
    options: {
      // Converts the string 'false' from .env to a real boolean
      encrypt: process.env.DB_ENCRYPT === 'true', 
      trustServerCertificate: true,
    },
  },
};