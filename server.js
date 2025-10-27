// ThreatRecon Labs - Production Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

// Import game modules
const gameEngine = require('./engine/gameEngine');
const AILogic = require('./engine/aiLogic');
const aiLogic = new AILogic();
const AttackerCommands = require('./engine/commands/attackerCommands');
const DefenderCommands = require('./engine/commands/defenderCommands');
const AARGenerator = require('./engine/aar');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ThreatRecon Labs' });
});

// Create match API
app.post('/api/labs/create', (req, res) => {
  try {
    const { role } = req.body;
    const match = gameEngine.createMatch(role || 'attacker');
    
    // Start AI logic for this match
    aiLogic.startAI(match);
    
    res.json({ matchId: match.id, playerRole: match.playerRole });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Get match API
app.get('/api/labs/match/:id', (req, res) => {
  const match = gameEngine.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json(match);
});

// Get AAR API
app.get('/api/labs/match/:id/aar', (req, res) => {
  const match = gameEngine.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  const aar = AARGenerator.generateAAR(match);
  res.json(aar);
});

// Serve Labs UI at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'labs.html'));
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  let currentMatch = null;
  
  // New xterm.js compatible handlers
  socket.on('initSession', async ({ role }) => {
    try {
      const match = gameEngine.createMatch(role || 'attacker');
      currentMatch = match;
      aiLogic.startAI(match);
      
      socket.emit('sessionCreated', {
        role: match.playerRole,
        user: match.playerRole === 'attacker' ? 'attacker' : 'defender',
        host: match.playerRole === 'attacker' ? 'kali' : 'SOC',
        cwd: '~',
        isRoot: false,
        objectiveTitle: role === 'attacker' ? 'Exfiltrate data and maintain persistence' : 'Detect and contain intrusion',
        objectiveText: role === 'attacker' ? 'Gain access, pivot laterally, exfiltrate sensitive data without detection.' : 'Monitor logs, collect evidence, block threats while maintaining service uptime.'
      });
      
      // Join the socket to this match
      socket.join(match.id);
    } catch (err) {
      console.error('Init session error:', err);
      socket.emit('error', { message: 'Failed to create session' });
    }
  });
  
  socket.on('join_match', ({ matchId }) => {
    currentMatch = gameEngine.getMatch(matchId);
    if (!currentMatch) {
      socket.emit('error', { message: 'Match not found' });
      return;
    }
    socket.join(matchId);
    console.log(`Socket ${socket.id} joined match ${matchId}`);
  });
  
  // New playerCommand handler for xterm.js
  socket.on('playerCommand', async ({ cmd }) => {
    if (!currentMatch || currentMatch.status !== 'active') {
      return;
    }
    
    try {
      const match = currentMatch;
      let result = { output: '', error: false };
      
      // Handle sudo/su commands for privilege escalation
      if (/^\s*(sudo|su\s?-|su)\b/.test(cmd)) {
        match.playerState.isRoot = true;
        socket.emit('output', { text: '\x1b[1;32mroot access granted\x1b[0m\n' });
        socket.emit('promptUpdate', { 
          user: 'root', 
          host: match.playerState.currentHost?.hostname || match.playerRole === 'attacker' ? 'kali' : 'SOC',
          cwd: match.playerState.cwd || '~',
          isRoot: true 
        });
        gameEngine.addEvent(match, { type: 'player_action', message: cmd, timestamp: new Date().toISOString() });
        return;
      }
      
      // Parse command and args
      const parts = cmd.split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      if (match.playerRole === 'attacker') {
        const attackerCmds = new AttackerCommands();
        result = attackerCmds.handleCommand(match, command, args);
        
        gameEngine.addEvent(match, {
          type: 'player_action',
          message: cmd,
          timestamp: new Date().toISOString(),
        });
      } else {
        const defenderCmds = new DefenderCommands();
        result = defenderCmds.handleCommand(match, command, args);
        
        gameEngine.addEvent(match, {
          type: 'player_action',
          message: cmd,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Send ANSI-colored output
      const ansiOutput = result.error 
        ? `\x1b[31m${result.output}\x1b[0m`
        : result.output || '';
      
      socket.emit('output', { 
        text: ansiOutput,
        appendTimeline: {
          time: new Date().toLocaleTimeString(),
          msg: cmd
        }
      });
      
      // Check win conditions
      const winner = gameEngine.checkWinConditions(match);
      if (winner) {
        gameEngine.endMatch(match.id, winner);
        aiLogic.stopAI(match);
        
        const aar = AARGenerator.generateAAR(match);
        socket.emit('matchEnded', { 
          aar: {
            outcome: winner === 'player' ? 'Victory' : 'Defeated',
            duration: Math.round((Date.now() - new Date(match.startedAt)) / 60000),
            timeline: match.timeline.map(t => ({ time: new Date(t.timestamp).toLocaleTimeString(), summary: t.message })),
            recommendations: aar.recommendations || []
          }
        });
      }
      
    } catch (err) {
      console.error('Command error:', err);
      socket.emit('output', { text: `\x1b[31mError: ${err.message}\x1b[0m\n` });
    }
  });
  
  socket.on('execute_command', async ({ matchId, command, args }) => {
    const match = gameEngine.getMatch(matchId);
    if (!match) {
      socket.emit('command_output', { output: 'Error: Match not found\n', error: true });
      return;
    }
    
    if (match.status !== 'active') {
      socket.emit('command_output', { output: 'Match has ended\n', error: true });
      return;
    }
    
    try {
      let result = { output: '', error: false };
      
      if (match.playerRole === 'attacker') {
        const attackerCmds = new AttackerCommands();
        result = attackerCmds.handleCommand(match, command, args);
        
        gameEngine.addEvent(match, {
          type: 'player_action',
          message: command + ' ' + args.join(' '),
          timestamp: new Date().toISOString(),
        });
      } else {
        const defenderCmds = new DefenderCommands();
        result = defenderCmds.handleCommand(match, command, args);
        
        gameEngine.addEvent(match, {
          type: 'player_action',
          message: command + ' ' + args.join(' '),
          timestamp: new Date().toISOString(),
        });
      }
      
      socket.emit('command_output', { output: result.output || '', error: result.error || false });
      
      // Broadcast timeline update
      io.to(matchId).emit('timeline_update', { timeline: match.timeline });
      
      // Check win conditions
      const winner = gameEngine.checkWinConditions(match);
      if (winner) {
        gameEngine.endMatch(matchId, winner);
        aiLogic.stopAI(match);
        
        const aar = AARGenerator.generateAAR(match);
        io.to(matchId).emit('match_ended', { winner, aar });
      }
      
    } catch (err) {
      console.error('Command error:', err);
      socket.emit('command_output', { output: `Error: ${err.message}\n`, error: true });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (currentMatch) {
      aiLogic.stopAI(currentMatch);
      // Clean up the match from in-memory store
      gameEngine.matches.delete(currentMatch.id);
    }
  });
});

// AI event broadcaster (runs every 3 seconds for active matches)
setInterval(() => {
  gameEngine.matches.forEach((match, matchId) => {
    if (match.status === 'active') {
      // AI events are generated in aiLogic.tickAI
      // This broadcasts them to connected clients
      io.to(matchId).emit('ai_event', {
        message: match.timeline[match.timeline.length - 1]?.message || 'AI processing...',
      });
    }
  });
}, 3000);

// Start server (for local dev only - Vercel doesn't call this)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`ThreatRecon Labs running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to play`);
  });
}

// Export app for Vercel serverless
module.exports = app;
