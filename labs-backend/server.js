const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const dayjs = require("dayjs");

// Import game engine
const runCommandInEngine = require('../engine/runCommandInEngine');

const app = express();

// --- allow the real site + local development ---
const allowedOrigins = [
  "https://threatrecon.io",
  "https://www.threatrecon.io",
  "https://threatrecon-site.onrender.com",
  "http://localhost:3000",
  "http://localhost:8080"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now(), sessions: sessions.size });
});

app.get("/healthz", (req, res) => res.send("OK"));

// In-memory sessions
const sessions = new Map();

// Helper: push timeline event
function pushTimeline(session, msg) {
  const ev = { time: dayjs().format('HH:mm:ss'), msg };
  session.timeline.unshift(ev);
  return ev;
}

const httpServer = createServer(app);

// --- socket.io with proper path ---
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
});

io.on("connection", (socket) => {
  console.log("[labs-backend] Connected:", socket.id);
  
  socket.on('initSession', ({ role }) => {
    console.info('[labs-backend] initSession', socket.id, role);

    if (!role || !['attacker','defender'].includes(role)) {
      socket.emit('errorEvent', { msg: 'Invalid role' });
      return;
    }

    const session = {
      id: socket.id,
      role,
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

    // AI heartbeat every 3.5s
    session.aiInterval = setInterval(() => {
      if (session.ended) return;

      const aiMsg = session.role === 'attacker'
        ? 'Defender tightened firewall rules'
        : 'Attacker probed internal SMB shares';

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
      setTimeout(() => { sessions.delete(socket.id); }, 5000);
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

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`[labs-backend] Listening on port ${PORT}`);
});
