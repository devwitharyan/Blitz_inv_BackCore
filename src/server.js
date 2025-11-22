const http = require('http'); 
const { Server } = require('socket.io'); 
const app = require('./app');
const db = require('./config/db'); 

// Handle Uncaught Exceptions (Synchronous errors)
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('⏳ Connecting to database...');
    await db.poolConnect;
    console.log('🟢 Connected to SQL Server database!');

    const server = http.createServer(app);

    // Socket.io Setup
    const io = new Server(server, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('🔌 New Client Connected:', socket.id);
      
      socket.on('join_provider_room', () => {
        socket.join('providers');
      });

      socket.on('disconnect', () => {
        // console.log('❌ Client Disconnected:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server is running: http://localhost:${PORT}`);
      // console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
    });

    // Handle Unhandled Rejections (Async errors, e.g. DB connection drops)
    process.on('unhandledRejection', (err) => {
      console.error('🔥 UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (err) {
    console.error(`❌ Failed to start: ${err.message}`);
    process.exit(1);
  }
})();