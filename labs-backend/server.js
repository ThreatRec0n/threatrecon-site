// server.js - Main server entry point
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./src/config');
const logger = require('./src/logger');
const apiRoutes = require('./src/api');
const setupSocket = require('./src/socket');

// Redis adapter for horizontal scaling (optional if REDIS_URL not provided)
let pubClient, subClient;
if (config.redisUrl) {
  logger.info('Initializing Redis adapter...');
  try {
    const redis = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    
    pubClient = redis.createClient({ url: config.redisUrl });
    subClient = pubClient.duplicate();
    
    (async () => {
      await pubClient.connect();
      await subClient.connect();
      logger.info('Redis connected successfully');
    })();
  } catch (error) {
    logger.warn('Redis not available:', error.message);
  }
}

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Health check route (root)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'threatrecon-labs-backend',
    version: '1.0.0'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.frontendOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Attach Redis adapter if available
if (pubClient && subClient) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('Socket.IO Redis adapter attached');
}

// Initialize socket handlers
const simulator = setupSocket(io);

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if run directly (not when imported for tests)
if (require.main === module) {
  const PORT = config.port;
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Frontend origin: ${config.frontendOrigin}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

module.exports = { app, server, io, simulator };
