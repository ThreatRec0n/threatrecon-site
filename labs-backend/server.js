const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dayjs = require("dayjs");

// Import game engine
const runCommandInEngine = require('../engine/runCommandInEngine');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://threatrecon.io",
  "https://www.threatrecon.io",
  "https://threatrecon-site.onrender.com",
  "http://localhost:3000"
];

console.log('[labs-backend] CORS origins configured:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// In-memory sessions (needed by health endpoint)
const sessions = new Map();

app.get("/healthz", (req, res) => res.send("OK"));

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now(), sessions: sessions.size });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io",
  transports: ["polling", "websocket"],
  pingTimeout: 60000
});

// Helper: push timeline event
function pushTimeline(session, msg) {
  const ev = { time: dayjs().format('HH:mm:ss'), msg };
  session.timeline.unshift(ev);
  return ev;
}

io.on("connection", (socket) => {
  console.log("[labs-backend] Connected:", socket.id, "namespace:", socket.nsp?.name, "path:/socket.io");
  
  socket.on("initSession", ({ role }) => {
    console.log("[labs-backend] initSession received for", socket.id, "role:", role);

    if (!role || !['attacker', 'defender'].includes(role)) {
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
    
    console.log('[labs-backend] emitting sessionCreated to socket.id', socket.id, 'socket.nsp:', socket.nsp?.name);
    console.log('[labs-backend] sessionCreated payload:', JSON.stringify(session));
    socket.emit('sessionCreated', session);
    console.log('[labs-backend] sessionCreated SENT successfully to', socket.id);

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

  socket.on('disconnect', (reason) => {
    console.info('[labs-backend] disconnected', socket.id, 'reason:', reason);
    const session = sessions.get(socket.id);
    if (session) {
      if (session.aiInterval) clearInterval(session.aiInterval);
      sessions.delete(socket.id);
    }
  });
  
  socket.on('error', (err) => {
    console.error('[labs-backend] socket error', socket.id, err);
  });
});

io.on('error', (err) => {
  console.error('[labs-backend] IO error:', err);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[labs-backend] Listening on port ${PORT}`);
});
