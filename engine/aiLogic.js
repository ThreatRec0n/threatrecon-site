// ThreatRecon Labs - AI Opponent Logic
// Handles AI behavior for attacker and defender roles

class AILogic {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.aiTimers = new Map(); // sessionId -> intervalId
  }

  startAI(match) {
    if (this.aiTimers.has(match.id)) return; // already running
    
    const interval = setInterval(() => {
      this.tickAI(match);
    }, 3000); // AI acts every 3 seconds
    
    this.aiTimers.set(match.id, interval);
  }

  stopAI(match) {
    const interval = this.aiTimers.get(match.id);
    if (interval) {
      clearInterval(interval);
      this.aiTimers.delete(match.id);
    }
  }

  tickAI(match) {
    if (match.status !== 'active') {
      this.stopAI(match);
      return;
    }

    if (match.aiRole === 'attacker') {
      this.tickAttackerAI(match);
    } else {
      this.tickDefenderAI(match);
    }
    
    // Check win conditions
    const winner = this.gameEngine.checkWinConditions(match);
    if (winner) {
      this.gameEngine.endMatch(match.id, winner);
      this.stopAI(match);
    }
  }

  tickAttackerAI(match) {
    // AI plays the attacker role
    // AI randomly attempts exploits, lateral movement, data exfiltration
    
    const actions = [
      {
        name: 'scan',
        prob: 0.3,
        execute: () => {
          const hosts = match.network.hosts;
          const target = hosts[Math.floor(Math.random() * hosts.length)];
          
          this.gameEngine.addEvent(match, {
            type: 'ai_action',
            message: `AI: Scanning host ${target.hostname} (${target.ip})`,
            timestamp: new Date().toISOString(),
          });
          
          // Increase detection if player is noisy
          if (match.playerState.detectionLevel > 30) {
            match.aiState.awareness += 5;
          }
        },
      },
      {
        name: 'exploit',
        prob: 0.2,
        execute: () => {
          const hosts = match.network.hosts;
          const target = hosts[Math.floor(Math.random() * hosts.length)];
          
          this.gameEngine.addEvent(match, {
            type: 'ai_action',
            message: `AI: Attempting exploit on ${target.hostname} (Port ${target.ports[0]})`,
            timestamp: new Date().toISOString(),
          });
          
          // AI might succeed based on patch level
          const success = target.patchLevel === 'low' ? 0.5 : 0.2;
          if (Math.random() < success) {
            match.aiState.awareness += 20;
            this.gameEngine.addEvent(match, {
              type: 'ai_action',
              message: `AI: Successfully compromised ${target.hostname}`,
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
      {
        name: 'exfil',
        prob: 0.1,
        execute: () => {
          if (match.aiState.awareness > 50) {
            const sensitiveFiles = match.network.hosts.flatMap(h => h.sensitiveData);
            if (sensitiveFiles.length > 0) {
              const file = sensitiveFiles[Math.floor(Math.random() * sensitiveFiles.length)];
              this.gameEngine.addEvent(match, {
                type: 'ai_action',
                message: `AI: Exfiltrating ${file}`,
                timestamp: new Date().toISOString(),
              });
              match.aiState.exfiltratedData = match.aiState.exfiltratedData || [];
              match.aiState.exfiltratedData.push(file);
            }
          }
        },
      },
    ];
    
    // Roll for actions
    actions.forEach(action => {
      if (Math.random() < action.prob) {
        action.execute();
      }
    });
  }

  tickDefenderAI(match) {
    // AI plays the defender role
    // AI monitors for suspicious activity and reacts
    
    const actions = [
      {
        name: 'monitor',
        prob: 0.4,
        execute: () => {
          if (match.playerState.detectionLevel > 20) {
            match.aiState.awareness += 10;
            this.gameEngine.addEvent(match, {
              type: 'ai_action',
              message: 'AI Defender: Detected suspicious network activity',
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
      {
        name: 'block',
        prob: 0.2,
        execute: () => {
          if (match.aiState.awareness > 40 && !match.aiState.containmentActive) {
            match.aiState.containmentActive = true;
            match.aiState.blockList.push('10.0.2.99'); // simulated player IP
            this.gameEngine.addEvent(match, {
              type: 'ai_action',
              message: 'AI Defender: Blocking suspicious IP address in firewall',
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
      {
        name: 'evidence',
        prob: 0.15,
        execute: () => {
          if (match.aiState.awareness > 30 && match.aiState.evidenceCollected.length < 3) {
            const evidence = {
              hostname: match.network.hosts[0].hostname,
              timestamp: new Date().toISOString(),
              hash: this.generateHash(),
            };
            match.aiState.evidenceCollected.push(evidence);
            match.evidenceChain.push(evidence);
            this.gameEngine.addEvent(match, {
              type: 'ai_action',
              message: `AI Defender: Collected forensic snapshot from ${evidence.hostname}`,
              timestamp: new Date().toISOString(),
            });
          }
        },
      },
    ];
    
    actions.forEach(action => {
      if (Math.random() < action.prob) {
        action.execute();
      }
    });
  }

  generateHash() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

module.exports = AILogic;

