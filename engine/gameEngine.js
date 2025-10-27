// ThreatRecon Labs - Game Engine
// Manages game sessions, virtual network state, and match progression

class GameEngine {
  constructor() {
    this.matches = new Map(); // sessionId -> Match
  }

  createMatch(playerRole = 'attacker') {
    const sessionId = `match-${Date.now()}`;
    const match = {
      id: sessionId,
      playerRole, // 'attacker' or 'defender'
      aiRole: playerRole === 'attacker' ? 'defender' : 'attacker',
      status: 'active', // 'active', 'ended'
      startedAt: new Date().toISOString(),
      endedAt: null,
      winner: null, // 'player', 'ai', or null
      
      // Virtual network topology
      network: this.generateNetwork(),
      
      // Player state
      playerState: {
        currentHost: null, // which host player is on
        foothold: [], // list of hosts player has gained access to
        dataStolen: [], // list of sensitive files exfiltrated
        detectionLevel: 0, // 0-100, increases with noisy actions
      },
      
      // AI state
      aiState: {
        awareness: 0, // 0-100, increases when player does suspicious things
        blockList: [], // IPs/Domains AI defender has blocked
        evidenceCollected: [], // forensic artifacts collected
        containmentActive: false,
      },
      
      // Objectives
      objectives: this.generateObjectives(playerRole),
      
      // Timeline events
      timeline: [],
      
      // Evidence chain
      evidenceChain: [],
    };
    
    this.matches.set(sessionId, match);
    
    // Initial event
    this.addEvent(match, {
      type: 'system',
      message: `Match started. You are playing as ${playerRole.toUpperCase()}.`,
      timestamp: new Date().toISOString(),
    });
    
    return match;
  }

  generateNetwork() {
    // Virtual network with 3-4 hosts
    const hosts = [
      {
        hostname: 'web01',
        ip: '10.0.2.15',
        os: 'Ubuntu 20.04',
        ports: [22, 80, 443, 3306],
        services: ['nginx', 'mysql'],
        patchLevel: 'high', // makes exploits harder
        sensitiveData: ['/var/www/finances.db'],
        credentials: { // attacker needs these to progress
          user: 'www-data',
          password: 'temp123',
        },
      },
      {
        hostname: 'fileserver',
        ip: '10.0.2.23',
        os: 'Ubuntu 18.04',
        ports: [22, 445, 2049], // SMB, NFS
        services: ['samba', 'nfs'],
        patchLevel: 'medium',
        sensitiveData: ['/shared/payroll.xlsx', '/shared/customer-data.csv'],
        credentials: {
          user: 'admin',
          password: 'admin',
        },
      },
      {
        hostname: 'dc01',
        ip: '10.0.2.50',
        os: 'Windows Server 2016',
        ports: [88, 135, 389, 445, 636],
        services: ['active-directory', 'ldap'],
        patchLevel: 'high',
        sensitiveData: ['AD database'],
        credentials: {
          user: 'administrator',
          password: 'P@ssw0rd!',
        },
      },
      {
        hostname: 'dbserver',
        ip: '10.0.2.67',
        os: 'Debian 10',
        ports: [22, 3306, 5432],
        services: ['mysql', 'postgresql'],
        patchLevel: 'low',
        sensitiveData: ['customer_db.sql', 'transactions.csv'],
        credentials: {
          user: 'dbadmin',
          password: 'db123456',
        },
      },
    ];
    
    return {
      hosts,
      subnet: '10.0.2.0/24',
      gateway: '10.0.2.1',
    };
  }

  generateObjectives(playerRole) {
    if (playerRole === 'attacker') {
      return {
        primary: 'Exfiltrate sensitive data and maintain persistence for 10 minutes',
        steps: [
          'Gain initial foothold on a host (Port 22 SSH or exploit)',
          'Perform lateral movement to access additional systems',
          'Locate and exfiltrate sensitive data files',
          'Establish persistence to survive for 10 minutes',
        ],
      };
    } else {
      // defender
      return {
        primary: 'Detect and contain intrusion while maintaining service uptime',
        steps: [
          'Monitor logs and network traffic for suspicious activity',
          'Collect forensic evidence with proper chain of custody',
          'Block attacker IPs and isolate compromised hosts',
          'Preserve evidence and document containment actions',
        ],
      };
    }
  }

  addEvent(match, event) {
    match.timeline.push({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }

  getMatch(sessionId) {
    return this.matches.get(sessionId);
  }

  endMatch(sessionId, winner) {
    const match = this.getMatch(sessionId);
    if (!match) return null;
    
    match.status = 'ended';
    match.endedAt = new Date().toISOString();
    match.winner = winner;
    
    this.addEvent(match, {
      type: 'system',
      message: `Match ended. Winner: ${winner.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });
    
    return match;
  }

  checkWinConditions(match) {
    if (match.status !== 'active') return null;
    
    const duration = (Date.now() - new Date(match.startedAt)) / 60000; // minutes
    
    if (match.playerRole === 'attacker') {
      // Attacker wins if they stole data AND survived 10 minutes
      if (match.playerState.dataStolen.length > 0 && duration >= 10) {
        return 'player';
      }
      // AI defender wins if they detected and contained before 10 minutes
      if (match.aiState.containmentActive && duration < 10) {
        return 'ai';
      }
    } else {
      // Defender
      // Defender wins if they collected evidence AND contained threat
      if (match.aiState.evidenceCollected.length > 0 && match.aiState.containmentActive) {
        return 'player';
      }
      // Attacker wins if they stole data and survived
      if (match.playerState.dataStolen.length > 0 && duration >= 10) {
        return 'ai';
      }
    }
    
    return null;
  }
}

const gameEngine = new GameEngine();
module.exports = gameEngine;

