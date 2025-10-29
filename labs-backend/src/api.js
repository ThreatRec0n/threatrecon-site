// api.js - Express API routes
const express = require('express');
const logger = require('./logger');
const Simulator = require('./simulator');

const router = express.Router();
const simulator = new Simulator();

// Health check (mounted at /api)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sessions: simulator.sessions.size
  });
});

// Get session status
router.get('/status', (req, res) => {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const session = simulator.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.id,
    cwd: session.cwd,
    user: session.user,
    isRoot: session.isRoot,
    historyLength: session.history.length
  });
});

module.exports = router;

