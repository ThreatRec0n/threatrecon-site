// ThreatRecon Labs - Attacker Commands
// Simulates offensive commands and returns realistic output

class AttackerCommands {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  handleCommand(match, command, args = []) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case 'help':
        return this.showHelp();
      
      case 'scan':
      case 'nmap':
        return this.scan(match, args);
      
      case 'ssh':
        return this.ssh(match, args);
      
      case 'ls':
      case 'dir':
        return this.listFiles(match);
      
      case 'cat':
      case 'type':
        return this.viewFile(match, args);
      
      case 'exfil':
      case 'exfiltrate':
        return this.exfiltrate(match, args);
      
      case 'whoami':
        return this.whoami(match);
      
      case 'id':
        return this.id(match);
      
      case 'pwd':
        return this.pwd(match);
      
      case 'clear':
        return { output: '', clear: true };
      
      default:
        return {
          output: `-bash: ${command}: command not found\n`,
          error: true,
        };
    }
  }

  showHelp() {
    return {
      output: `Available Commands:
  scan <ip/hostname>     - Scan for open ports
  ssh <host>             - Connect via SSH
  ls                     - List files in current directory
  cat <file>             - View file contents
  exfil <file>           - Exfiltrate sensitive data
  whoami                 - Show current user
  id                     - Show user ID and groups
  pwd                    - Show current directory
  clear                  - Clear terminal
  help                   - Show this help\n`,
    };
  }

  scan(match, args) {
    const target = args[0] || '10.0.2.15';
    const host = match.network.hosts.find(h => h.ip === target || h.hostname === target);
    
    if (!host) {
      return {
        output: `Starting Nmap scan against ${target}...\nNo open ports found.\n`,
      };
    }
    
    const output = `Starting Nmap 7.80 ( https://nmap.org ) at ${new Date().toISOString()}
Nmap scan report for ${host.hostname} (${host.ip})
Host is up (0.001s latency).
Not shown: 65530 closed ports
PORT     STATE SERVICE  VERSION
${host.ports.map(p => `${p.toString().padEnd(9)} open    ${host.services[host.ports.indexOf(p)] || 'unknown'}`).join('\n')}

Nmap done: 1 IP address (1 host up) scanned in 0.5 seconds\n`;
    
    // Increase detection for noisy scans
    match.playerState.detectionLevel += 5;
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: `Performed network scan against ${target}`,
      timestamp: new Date().toISOString(),
    });
    
    return { output };
  }

  ssh(match, args) {
    const target = args[0];
    if (!target) {
      return { output: 'Usage: ssh <hostname>\n' };
    }
    
    const host = match.network.hosts.find(h => h.hostname === target || h.ip === target);
    if (!host) {
      return { output: `ssh: Could not resolve hostname ${target}\n` };
    }
    
    match.playerState.currentHost = host;
    match.playerState.foothold.push(host.hostname);
    
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: `Gained SSH access to ${host.hostname}`,
      timestamp: new Date().toISOString(),
    });
    
    return {
      output: `Connected to ${host.hostname} via SSH\n${host.hostname}:~$ `,
      continue: true,
    };
  }

  listFiles(match) {
    if (!match.playerState.currentHost) {
      return { output: 'ls: No host connection active\n' };
    }
    
    const sensitiveData = match.playerState.currentHost.sensitiveData || [];
    const output = `total 8
drwxr-xr-x 2 root root 4096 Jan 15 10:30 .
drwxr-xr-x 3 root root 4096 Jan 15 09:00 ..
${sensitiveData.map(f => `-rw-r--r-- 1 root root 2048 Jan 15 10:30 ${f.split('/').pop()}`).join('\n')}\n`;
    
    return { output };
  }

  viewFile(match, args) {
    if (!args[0]) {
      return { output: 'Usage: cat <filename>\n' };
    }
    
    const host = match.playerState.currentHost;
    if (!host) {
      return { output: 'cat: No host connection active\n' };
    }
    
    const file = args[0];
    const sensitiveData = host.sensitiveData || [];
    
    return {
      output: `Database structure for ${file}\nSQLite version 3.31.1\n[DATA CONTENT DUMMY]\n`,
    };
  }

  exfiltrate(match, args) {
    if (!args[0]) {
      return { output: 'Usage: exfil <filename>\n' };
    }
    
    const host = match.playerState.currentHost;
    if (!host) {
      return { output: 'exfil: No host connection active\n' };
    }
    
    const file = args[0];
    match.playerState.dataStolen.push({
      file,
      host: host.hostname,
      timestamp: new Date().toISOString(),
    });
    
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: `Exfiltrated ${file} from ${host.hostname}`,
      timestamp: new Date().toISOString(),
    });
    
    return { output: `Exfiltrating ${file}...\nTransfer complete. 2048 bytes uploaded.\n` };
  }

  whoami(match) {
    const user = match.playerState.currentHost?.credentials?.user || 'attacker';
    return { output: `${user}\n` };
  }

  id(match) {
    const user = match.playerState.currentHost?.credentials?.user || 'attacker';
    return { output: `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),27(sudo)\n` };
  }

  pwd(match) {
    return { output: '/home/attacker\n' };
  }
}

module.exports = AttackerCommands;

