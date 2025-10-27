// ThreatRecon Labs - Complete Server with Game Engine
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

// Import game modules
const gameEngine = require('./engine/gameEngine');
const AILogic = require('./engine/aiLogic');
const aiLogic = new AILogic(gameEngine);
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
  const { role } = req.body;
  const match = gameEngine.createMatch(role || 'attacker');
  
  // Start AI logic for this match
  aiLogic.startAI(match);
  
  res.json({ matchId: match.id, playerRole: match.playerRole });
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

// Serve labs UI
app.get('/labs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'labs.html'));
});

// Serve main page (redirect to labs for now)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'labs.html'));
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_match', ({ matchId }) => {
    socket.join(matchId);
    console.log(`Socket ${socket.id} joined match ${matchId}`);
  });
  
  socket.on('execute_command', async ({ matchId, command, args }) => {
    const match = gameEngine.getMatch(matchId);
    if (!match || match.status !== 'active') {
      socket.emit('command_output', { output: 'Match not found or ended\n' });
      return;
    }
    
    let output, error = false;
    
    try {
      if (match.playerRole === 'attacker') {
        const attackerCmds = new AttackerCommands(gameEngine);
        const result = attackerCmds.handleCommand(match, command, args);
        output = result.output || '';
        error = result.error || false;
        
        if (!result.continue) {
          gameEngine.addEvent(match, {
            type: 'player_action',
            message: command + ' ' + args.join(' '),
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        const defenderCmds = new DefenderCommands(gameEngine);
        const result = defenderCmds.handleCommand(match, command, args);
        output = result.output || '';
        error = result.error || false;
        
        gameEngine.addEvent(match, {
          type: 'player_action',
          message: command + ' ' + args.join(' '),
          timestamp: new Date().toISOString(),
        });
      }
      
      socket.emit('command_output', { output, error });
      
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
  });
});

// Start server (for local dev only - Vercel doesn't call this)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`ThreatRecon Labs running on port ${PORT}`);
  });
}

// Export app for Vercel serverless
module.exports = app;

