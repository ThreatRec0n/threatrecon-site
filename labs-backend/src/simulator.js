// simulator.js - Core command simulation engine
const logger = require('./logger');
const config = require('./config');

class Simulator {
  constructor() {
    this.sessions = new Map();
    this.gameState = {
      discoveredIPs: new Set(),
      discoveredPorts: new Map(),
      compromisedHosts: new Set()
    };
  }

  // Command categories
  LOCAL_SIM_COMMANDS = [
    'ls', 'cd', 'pwd', 'cat', 'whoami', 'id', 'hostname', 
    'clear', 'history', 'less', 'more', 'help'
  ];

  SIM_NETWORK_COMMANDS = [
    'nmap', 'ping', 'curl', 'wget', 'ifconfig', 'ip', 'netstat'
  ];

  BACKEND_ACTION_COMMANDS = [
    'ssh', 'exfil', 'exploit', 'scp', 'nc', 'netcat'
  ];

  createSession(sessionId, metadata = {}) {
    this.sessions.set(sessionId, {
      id: sessionId,
      cwd: '/home/kali',
      user: 'kali',
      isRoot: false,
      history: [],
      created: Date.now(),
      ...metadata
    });
    logger.info(`Created session ${sessionId}`);
    return this.sessions.get(sessionId);
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  execCommand(command, sessionId, socket) {
    const argv = command.trim().split(/\s+/).filter(Boolean);
    if (argv.length === 0) return { type: 'empty', output: '' };
    
    const cmd = argv[0];
    const args = argv.slice(1);

    // Categorize command
    if (this.LOCAL_SIM_COMMANDS.includes(cmd)) {
      return this.handleLocalSim(cmd, args, sessionId);
    } else if (this.SIM_NETWORK_COMMANDS.includes(cmd)) {
      return this.handleSimNetwork(cmd, args, sessionId);
    } else if (this.BACKEND_ACTION_COMMANDS.includes(cmd)) {
      return this.handleBackendAction(cmd, args, sessionId, socket);
    } else {
      return {
        type: 'unknown',
        output: `bash: ${cmd}: command not found\n`,
        shouldForward: false
      };
    }
  }

  handleLocalSim(cmd, args, sessionId) {
    const session = this.getSession(sessionId);
    
    switch (cmd) {
      case 'pwd':
        return {
          type: 'output',
          output: `${session.cwd}\n`
        };

      case 'whoami':
        return {
          type: 'output',
          output: `${session.user}\n`
        };

      case 'id':
        const uid = session.isRoot ? 0 : 1000;
        const gid = session.isRoot ? 0 : 1000;
        return {
          type: 'output',
          output: `uid=${uid}(${session.user}) gid=${gid} groups=${gid}\n`
        };

      case 'hostname':
        return {
          type: 'output',
          output: 'kali\n'
        };

      case 'clear':
        return {
          type: 'clear'
        };

      case 'ls':
        return this.simulateLs(args, session);

      case 'cat':
        return this.simulateCat(args, session);

      default:
        return {
          type: 'output',
          output: `${cmd}: not implemented\n`
        };
    }
  }

  simulateLs(args, session) {
    const detailed = args.includes('-l') || args.includes('-la');
    const dir = session.cwd || '/home/kali';
    
    // Mock directory listing
    const files = [
      'Desktop', 'Documents', 'Downloads', 'Pictures', 
      'tools', '.bashrc', '.profile', 'README.txt'
    ];

    if (detailed) {
      const output = files.map(f => {
        const isDir = f.indexOf('.') !== 0 && !f.includes('.txt');
        return `drwxr-xr-x 1 kali kali  4096 Oct 28 12:00 ${f}`;
      }).join('\n') + '\n';
      return { type: 'output', output };
    } else {
      return { type: 'output', output: files.join('  ') + '\n' };
    }
  }

  simulateCat(args, session) {
    if (args.length === 0) {
      return { type: 'error', output: 'Usage: cat <file>\n' };
    }
    const file = args[0];
    
    // Mock file content
    if (file === 'README.txt') {
      return {
        type: 'output',
        output: 'ThreatRecon Labs - Simulated Kali environment.\nThis is a training-only simulation.\n'
      };
    }
    
    return {
      type: 'error',
      output: `cat: ${file}: No such file or directory\n`
    };
  }

  handleSimNetwork(cmd, args, sessionId, socket) {
    switch (cmd) {
      case 'nmap':
        return this.simulateNmap(args);
      
      case 'ping':
        return this.simulatePing(args);
      
      case 'ifconfig':
        return this.simulateIfconfig();
      
      default:
        return {
          type: 'output',
          output: `${cmd}: simulated network command\n`
        };
    }
  }

  simulateNmap(args) {
    const target = args[0] || config.simTargetIP;
    const output = [
      `Starting Nmap 7.95 ( https://nmap.org )`,
      `Nmap scan report for ${target}`,
      `Host is up (0.12s latency).`,
      `Not shown: 997 closed ports`,
      `PORT     STATE SERVICE`,
      `22/tcp   open  ssh`,
      `80/tcp   open  http`,
      `443/tcp  open  https`,
      `3306/tcp open  mysql`,
      ``,
      `Nmap done: 1 IP address (1 host up) scanned in 1.23 seconds\n`
    ].join('\n');
    
    return { type: 'output', output };
  }

  simulatePing(args) {
    const target = args[0] || '8.8.8.8';
    const output = [
      `PING ${target} (${target}) 56(84) bytes of data.`,
      `64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.912 ms`,
      `64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.823 ms`,
      `64 bytes from ${target}: icmp_seq=3 ttl=64 time=0.734 ms`,
      ``,
      `--- ${target} ping statistics ---`,
      `3 packets transmitted, 3 received, 0% packet loss, time 2015ms`,
      `rtt min/avg/max/mdev = 0.512/0.823/0.912/0.234 ms\n`
    ].join('\n');
    
    return { type: 'output', output };
  }

  simulateIfconfig() {
    const output = [
      `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500`,
      `        inet 192.168.56.101  netmask 255.255.255.0  broadcast 192.168.56.255`,
      `        ether 08:00:27:ab:cd:ef`,
      ``,
      `lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536`,
      `        inet 127.0.0.1  netmask 255.0.0.0\n`
    ].join('\n');
    
    return { type: 'output', output };
  }

  handleBackendAction(cmd, args, sessionId, socket) {
    logger.info(`Backend action: ${cmd} ${args.join(' ')}`);
    
    switch (cmd) {
      case 'ssh':
        return this.handleSsh(args, sessionId, socket);
      
      case 'exfil':
        return this.handleExfil(args, sessionId, socket);
      
      default:
        return {
          type: 'output',
          output: `${cmd}: backend action (simulated)\n`
        };
    }
  }

  handleSsh(args, sessionId, socket) {
    const target = args[0];
    const output = `ssh: connect to host ${target} port 22: Connection refused\n`;
    
    // Emit game event
    socket.emit('gameEvent', {
      type: 'ssh_attempt',
      target,
      sessionId
    });

    return { type: 'output', output };
  }

  handleExfil(args, sessionId, socket) {
    logger.info('Exfiltration simulated');
    
    socket.emit('gameEvent', {
      type: 'exfiltration',
      target: args[0],
      sessionId,
      timestamp: Date.now()
    });

    return {
      type: 'output',
      output: 'Exfiltration successful (simulated)\n'
    };
  }
}

module.exports = Simulator;

