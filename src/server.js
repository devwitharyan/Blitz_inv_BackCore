const app = require('./app');
const db = require('./config/db'); // SQL config

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('⏳ Connecting to database...');
    await db.poolConnect;
    console.log('🟢 Connected to SQL Server database!');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running: http://localhost:${PORT}`);
      console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error(`❌ Failed to start: ${err.message}`);
    process.exit(1);
  }
})();
