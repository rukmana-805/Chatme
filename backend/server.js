const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// Attach Socket.IO Handlers
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ChatMe Server Running Smoothly' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);

  // Self-Ping Keep-Alive System (Prevents Render / Free hosting sleep)
  const SERVER_URL = process.env.SERVER_URL;
  if (SERVER_URL) {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    console.log(`[Keep-Alive] Self-ping active for ${SERVER_URL} every 14 mins.`);

    setInterval(() => {
      try {
        const protocol = SERVER_URL.startsWith('https') ? require('https') : require('http');
        protocol.get(`${SERVER_URL}/api/health`, (res) => {
          console.log(`[Keep-Alive Ping] Heartbeat sent (${res.statusCode}) - Server active`);
        }).on('error', (err) => {
          console.error('[Keep-Alive Error]:', err.message);
        });
      } catch (err) {
        console.error('[Keep-Alive Error]:', err.message);
      }
    }, PING_INTERVAL);
  }
});
