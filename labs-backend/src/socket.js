// socket.js - Socket.IO event handlers
const Simulator = require('./simulator');
const logger = require('./logger');

module.exports = function setupSocket(io) {
  const simulator = new Simulator();

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('exec', (payload) => {
      const { command, sessionId } = payload;
      logger.info(`Exec: ${command} (session: ${sessionId})`);

      // Ensure session exists
      if (!simulator.getSession(sessionId)) {
        simulator.createSession(sessionId);
      }

      try {
        const result = simulator.execCommand(command, sessionId, socket);

        switch (result.type) {
          case 'output':
          case 'error':
            socket.emit('output', {
              text: result.output,
              sessionId,
              timestamp: Date.now()
            });
            break;

          case 'clear':
            socket.emit('output', {
              text: '\x1b[2J\x1b[H', // ANSI clear screen
              sessionId
            });
            break;

          case 'empty':
            // No output for empty commands
            break;

          default:
            socket.emit('output', {
              text: result.output || '',
              sessionId
            });
        }

        // Update session history
        const session = simulator.getSession(sessionId);
        if (session) {
          session.history.push(command);
          if (session.history.length > 100) {
            session.history.shift();
          }
        }

      } catch (error) {
        logger.error(`Exec error: ${error.message}`);
        socket.emit('errorEvent', {
          msg: error.message,
          sessionId
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return simulator;
};

