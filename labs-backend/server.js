// ThreatRecon Labs Backend Service
// Standalone Express + Socket.IO server for real-time game sessions
// Deploy to Render/Fly.io/etc with persistent connections

const express = require('express');
const http = require('http');
const cors = require('cors');
const dayjs = require('dayjs');
const { Server } = require('socket.io');
const path = require('path');

// Import game engine
const runCommandInEngine = require('../engine/runCommandInEngine');

// CONFIG
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://threatrecon.io';
const PORT = process.env.PORT || 8080;

// In-memory sessions
const sessions = new Map();

const app = express();
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Health endpoint for uptime checks
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now(), sessions: sessions.size });
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

console.info('[labs-backend] Socket.IO initialized');
console.info('[labs-backend] Frontend origin:', FRONTEND_ORIGIN);

// Helper: push timeline event
function pushTimeline(session, msg) {
  const ev = { time: dayjs().format('HH:mm:ss'), msg };
  session.timeline.unshift(ev);
  return ev;
}

io.on('connection', (socket) => {
  console.info('[labs-backend] connection', socket.id);

  socket.on('initSession', ({ role }) => {
    console.info('[labs-backend] initSession', socket.id, role);
    
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

    socket.emit('sessionCreated', session);
    console.info('[labs-backend] sessionCreated', socket.id, role);

    // Simple AI loop every 3.5s
    session.aiInterval = setInterval(() => {
      if (session.ended) return;
      
      const aiMsg = session.role === 'attacker'
        ? 'Defender tightened firewall rules'
        : 'Attacker probed SMB shares on internal host';
      
      const ev = pushTimeline(session, aiMsg);

      socket.emit('output', {
        text: '',
        appendTimeline: ev,
        showPrompt: false
      });
    }, 3500);
  });

  socket.on('playerCommand', async ({ cmd }) => {
    const session = sessions.get(socket.id);
    if (!session || session.ended) {
      socket.emit('output', {
        text: '\x1b[1;31m[session closed]\x1b[0m\n',
        showPrompt: false
      });
      return;
    }

    let result;
    try {
      result = await runCommandInEngine(session, cmd);
    } catch (err) {
      console.error('[labs-backend] command error', err);
      result = {
        text: '\x1b[1;31m[engine error]\x1b[0m\n',
        appendTimeline: { time: dayjs().format('HH:mm:ss'), msg: 'Engine error on command' },
        endMatch: false
      };
    }

    socket.emit('output', {
      text: result.text || '',
      appendTimeline: result.appendTimeline || null,
      showPrompt: !result.endMatch
    });

    if (result.promptPatch) {
      Object.assign(session, result.promptPatch);
      socket.emit('promptUpdate', {
        user: session.user,
        host: session.host,
        cwd: session.cwd,
        isRoot: session.isRoot
      });
    }

    if (result.endMatch) {
      session.ended = true;
      clearInterval(session.aiInterval);
      
      socket.emit('matchEnded', {
        aar: result.aar,
        outcome: result.outcome
      });
      
      setTimeout(() => { 
        sessions.delete(socket.id);
        console.info('[labs-backend] cleaned up session', socket.id);
      }, 5000);
    }
  });

  socket.on('disconnect', () => {
    console.info('[labs-backend] disconnect', socket.id);
    const session = sessions.get(socket.id);
    if (session) {
      if (session.aiInterval) clearInterval(session.aiInterval);
      sessions.delete(socket.id);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[labs-backend] listening on ${PORT}`);
});

