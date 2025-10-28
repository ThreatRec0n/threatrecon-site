// Vercel Serverless Function for ThreatRecon Labs
// Hosts Express + Socket.IO with in-memory sessions

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');

// Import game engine modules
const gameEngine = require('../engine/gameEngine');
const aiLogic = require('../engine/aiLogic');
const AttackerCommands = require('../engine/commands/attackerCommands');
const DefenderCommands = require('../engine/commands/defenderCommands');
const runCommandInEngine = require('../engine/runCommandInEngine');

// Global singleton pattern for Vercel
let cached = global.__TR_APP__;

if (!cached) {
  console.info('[api/server] Initializing Express + Socket.IO for Vercel...');
  
  const app = express();
  
  // Middleware
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  
  // Static files from public/
  // In Vercel, the built files are in dist/, so we serve from there
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  
  // Create HTTP server
  const httpServer = http.createServer(app);
  
  // Initialize Socket.IO with polling only (Vercel-friendly)
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' },
    transports: ['polling'],
    pingTimeout: 60000
  });
  
  console.info('[api/server] Socket.IO initialized on path:', io.opts.path);
  console.info('[api/server] Transports:', io.opts.transports);
  
  // In-memory session storage
  const sessions = new Map();
  
  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.info('[socket] connection', socket.id);
    
    socket.on('initSession', ({ role }) => {
      console.info('[socket] initSession', socket.id, role);
      
      if (!role || !['attacker', 'defender'].includes(role)) {
        socket.emit('errorEvent', { msg: 'Invalid role' });
        return;
      }
      
      const session = {
        id: socket.id,
        role: role,
        user: role === 'attacker' ? 'attacker' : 'defender',
        host: role === 'attacker' ? 'kali' : 'soc',
        cwd: '~',
        isRoot: false,
        startedAt: Date.now(),
        ended: false,
        detectionScore: 0,
        timeline: []
      };
      
      sessions.set(socket.id, session);
      
      console.info('[socket] sessionCreated', socket.id, role);
      socket.emit('sessionCreated', session);
      
      // Start AI loop (simple simulation for now)
      session.aiInterval = setInterval(() => {
        if (!session || session.ended) return;
        
        // AI generates timeline events
        const ev = {
          time: new Date().toLocaleTimeString(),
          msg: session.role === 'attacker' 
            ? 'Defender tightened firewall rules'
            : 'Attacker probed SMB shares on internal host',
          type: 'info'
        };
        session.timeline.unshift(ev);
        
        socket.emit('output', {
          text: '',
          appendTimeline: ev,
          showPrompt: false
        });
      }, 3000);
    });
    
    socket.on('playerCommand', async ({ cmd }) => {
      console.info('[socket] playerCommand', socket.id, cmd);
      
      const session = sessions.get(socket.id);
      if (!session || session.ended) {
        socket.emit('output', {
          text: '\x1b[1;31m[session closed]\x1b[0m\n',
          showPrompt: false
        });
        return;
      }
      
      try {
        // Run command in game engine
        const result = await runCommandInEngine(session, cmd);
        
        socket.emit('output', {
          text: result.text,
          appendTimeline: result.appendTimeline || null,
          showPrompt: !result.endMatch
        });
        
        // Update prompt if privilege changed
        if (result.promptPatch) {
          Object.assign(session, result.promptPatch);
          socket.emit('promptUpdate', {
            user: session.user,
            host: session.host,
            cwd: session.cwd,
            isRoot: session.isRoot
          });
        }
        
        // Check if match ended
        if (result.endMatch) {
          session.ended = true;
          if (session.aiInterval) clearInterval(session.aiInterval);
          
          const AARGenerator = require('../engine/aar');
          const aar = AARGenerator.generateAAR(session);
          
          socket.emit('matchEnded', {
            aar: aar,
            outcome: result.outcome
          });
          
          // Cleanup after 5 seconds
          setTimeout(() => {
            sessions.delete(socket.id);
            console.info('[socket] cleaned up session', socket.id);
          }, 5000);
        }
      } catch (err) {
        console.error('[socket] command error', err);
        socket.emit('output', {
          text: `\x1b[1;31mError: ${err.message}\x1b[0m\n`,
          showPrompt: true
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.info('[socket] disconnect', socket.id);
      const session = sessions.get(socket.id);
      if (session && session.aiInterval) {
        clearInterval(session.aiInterval);
      }
      sessions.delete(socket.id);
    });
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ ok: true, sessions: sessions.size });
  });
  
  cached = {
    handler: serverless(app),
    httpServer: httpServer,
    io: io,
    sessions: sessions
  };
  
  global.__TR_APP__ = cached;
  
  console.info('[api/server] Initialization complete');
}

// Export serverless handler
module.exports = async function(req, res) {
  return cached.handler(req, res);
};

