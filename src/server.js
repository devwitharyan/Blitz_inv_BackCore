const http = require('http'); // Import HTTP
const { Server } = require('socket.io'); // Import Socket.io
const app = require('./app');
const db = require('./config/db'); 

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('⏳ Connecting to database...');
    await db.poolConnect;
    console.log('🟢 Connected to SQL Server database!');

    // 1. Create HTTP Server
    const server = http.createServer(app);

    // 2. Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: "*", // Allow Flutter app to connect
        methods: ["GET", "POST"]
      }
    });

    // 3. Store 'io' globally (or attach to app) so Controllers can use it
    app.set('io', io);

    // 4. Handle Connections
    io.on('connection', (socket) => {
      console.log('🔌 New Client Connected:', socket.id);
      
      // Join a 'providers' room so we can broadcast to them specifically
      socket.on('join_provider_room', () => {
        socket.join('providers');
        console.log(`Client ${socket.id} joined 'providers' room`);
      });

      socket.on('disconnect', () => {
        console.log('❌ Client Disconnected:', socket.id);
      });
    });

    // 5. Listen (Use 'server' instead of 'app')
    server.listen(PORT, () => {
      console.log(`🚀 Server is running: http://localhost:${PORT}`);
      console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`⚡ Socket.io is ready`);
    });

  } catch (err) {
    console.error(`❌ Failed to start: ${err.message}`);
    process.exit(1);
  }
})();