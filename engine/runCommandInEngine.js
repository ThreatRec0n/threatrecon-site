// ThreatRecon Labs - Command Execution Engine
// Simulates realistic command outputs with ANSI coloring and state management

const gameEngine = require('./gameEngine');
const AILogic = require('./aiLogic');
const aiLogic = new AILogic();
const AttackerCommands = require('./commands/attackerCommands');
const DefenderCommands = require('./commands/defenderCommands');
const AARGenerator = require('./aar');

async function runCommandInEngine(session, rawCmd) {
  if (!session || !rawCmd) {
    return { text: '\x1b[31mError: Invalid session or command\x1b[0m\n', error: true };
  }

  if (session.status !== 'active') {
    return { text: '\x1b[33mMatch has ended\x1b[0m\n' };
  }

  const cmd = rawCmd.trim();
  const parts = cmd.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  let result = { text: '', error: false, appendTimeline: null, endMatch: false };

  try {
    // Handle sudo/su for privilege escalation
    if (/^\s*(sudo|su\s?-|su)\b/.test(cmd)) {
      session.playerState.isRoot = true;
      if (session.playerRole === 'attacker') {
        session.playerState.user = 'root';
        session.playerState.host = 'kali';
      } else {
        session.playerState.user = 'administrator';
        session.playerState.host = 'DC01';
      }
      
      result.text = '\x1b[1;32mroot access granted\x1b[0m\n';
      result.appendTimeline = {
        time: new Date().toLocaleTimeString(),
        msg: 'Privilege escalated to root'
      };
      
      gameEngine.addEvent(session, {
        type: 'player_action',
        message: 'Gained root privileges',
        timestamp: new Date().toISOString(),
      });
      
      // Increase detection for privilege escalation
      session.playerState.detectionLevel += 15;
      
      return result;
    }

    // Route to appropriate command handler
    if (session.playerRole === 'attacker') {
      const attackerCmds = new AttackerCommands();
      const cmdResult = attackerCmds.handleCommand(session, command, args);
      
      result.text = cmdResult.output || '';
      result.error = cmdResult.error || false;
      
      // Add ANSI coloring
      if (result.error) {
        result.text = '\x1b[31m' + result.text + '\x1b[0m';
      }
      
      gameEngine.addEvent(session, {
        type: 'player_action',
        message: cmd,
        timestamp: new Date().toISOString(),
      });
      
      // Check for match-ending conditions
      const winner = gameEngine.checkWinConditions(session);
      if (winner) {
        gameEngine.endMatch(session.id, winner);
        aiLogic.stopAI(session);
        
        const aar = AARGenerator.generateAAR(session);
        result.endMatch = true;
        result.outcome = winner === 'player' ? 'Victory' : 'Defeated';
        result.aar = {
          outcome: winner === 'player' ? 'Victory' : 'Defeated',
          duration: Math.round((Date.now() - new Date(session.startedAt)) / 60000),
          timeline: session.timeline.map(t => ({ 
            time: new Date(t.timestamp).toLocaleTimeString(), 
            summary: t.message 
          })),
          recommendations: aar.recommendations || []
        };
      } else {
        // Add timeline entry for significant actions
        result.appendTimeline = {
          time: new Date().toLocaleTimeString(),
          msg: `Executed: ${cmd}`
        };
      }
      
    } else {
      const defenderCmds = new DefenderCommands();
      const cmdResult = defenderCmds.handleCommand(session, command, args);
      
      result.text = cmdResult.output || '';
      result.error = cmdResult.error || false;
      
      if (result.error) {
        result.text = '\x1b[31m' + result.text + '\x1b[0m';
      }
      
      gameEngine.addEvent(session, {
        type: 'player_action',
        message: cmd,
        timestamp: new Date().toISOString(),
      });
      
      const winner = gameEngine.checkWinConditions(session);
      if (winner) {
        gameEngine.endMatch(session.id, winner);
        aiLogic.stopAI(session);
        
        const aar = AARGenerator.generateAAR(session);
        result.endMatch = true;
        result.outcome = winner === 'player' ? 'Victory' : 'Defeated';
        result.aar = {
          outcome: winner === 'player' ? 'Victory' : 'Defeated',
          duration: Math.round((Date.now() - new Date(session.startedAt)) / 60000),
          timeline: session.timeline.map(t => ({ 
            time: new Date(t.timestamp).toLocaleTimeString(), 
            summary: t.message 
          })),
          recommendations: aar.recommendations || []
        };
      } else {
        result.appendTimeline = {
          time: new Date().toLocaleTimeString(),
          msg: `Executed: ${cmd}`
        };
      }
    }

    return result;

  } catch (err) {
    console.error('Command execution error:', err);
    return { 
      text: `\x1b[31mError: ${err.message}\x1b[0m\n`, 
      error: true 
    };
  }
}

module.exports = runCommandInEngine;

