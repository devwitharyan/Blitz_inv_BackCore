const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Note: Ensure you place your 'serviceAccountKey.json' in the src/config folder
// or use environment variables in production.
try {
  // Check if service account file exists or use env vars
  const serviceAccount = require('./serviceAccountKey.json'); 
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('🔥 Firebase Admin Initialized');
} catch (error) {
  console.warn('⚠️ Firebase Admin setup failed. Notifications will not work.');
  console.warn('Make sure src/config/serviceAccountKey.json exists.');
}

module.exports = admin;