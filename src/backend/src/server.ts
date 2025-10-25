import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { 
  securityHeadersMiddleware,
  apiRateLimit,
  authRateLimit,
  sessionRateLimit,
  inputSanitizationMiddleware,
  requestLoggingMiddleware,
  securityAuditMiddleware,
  corsOptions
} from './middleware/security';

import { tenantMiddleware } from './middleware/authMiddleware';
import { requestIdMiddleware, requestSizeLimiter } from './middleware/validation';
import { piiGuardMiddleware } from './middleware/piiGuard';

// Import routes
import scenarioRoutes from './routes/scenario';
import facilitatorRoutes from './routes/facilitator';
import sessionRoutes from './routes/session';

// Import services
import { logger } from './utils/logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

const PORT = process.env['PORT'] || 3001;

// Enhanced Security Middleware Stack
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use(securityHeadersMiddleware);
app.use(securityAuditMiddleware);
app.use(inputSanitizationMiddleware);
app.use(requestSizeLimiter(10 * 1024 * 1024)); // 10MB limit

// Enhanced CORS with security
app.use(cors(corsOptions));

// Enhanced Helmet with stricter CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Next.js
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "ws:", "wss:", process.env.FRONTEND_URL || "http://localhost:3000"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

// Enhanced Rate Limiting with different limits for different endpoints
app.use('/api/auth', authRateLimit);
app.use('/api/session', sessionRateLimit);
app.use('/api/', apiRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLoggingMiddleware);

// Tenant isolation middleware
app.use(tenantMiddleware);

// PII Guard middleware for public SaaS
app.use(piiGuardMiddleware);

// Routes
app.use('/api/scenario', scenarioRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/facilitator', facilitatorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-session', (sessionId: string, role: string) => {
    socket.join(sessionId);
    logger.info(`Client ${socket.id} joined session ${sessionId} as ${role}`);
    
    // Broadcast to other clients in the session
    socket.to(sessionId).emit('participant-joined', {
      role,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('leave-session', (sessionId: string) => {
    socket.leave(sessionId);
    logger.info(`Client ${socket.id} left session ${sessionId}`);
  });

  socket.on('decision', (data: { sessionId: string; role: string; decision: any }) => {
    logger.info(`Decision received from ${data.role} in session ${data.sessionId}`);
    
    // Broadcast decision to all clients in the session
    io.to(data.sessionId).emit('decision', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    requestId: req.headers['x-request-id']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    requestId: req.headers['x-request-id']
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 ThreatRecon Drill Platform Backend running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔒 Security features: CSP, Rate Limiting, Input Sanitization, Audit Logging`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, server, io };
