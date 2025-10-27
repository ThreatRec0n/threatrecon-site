// ThreatRecon Labs - Defender Commands
// Simulates defensive/soc analyst commands and returns realistic output

class DefenderCommands {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
  }

  handleCommand(match, command, args = []) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case 'help':
        return this.showHelp();
      
      case 'get-eventlog':
        return this.getEventLog(match);
      
      case 'get-nettcpconnection':
        return this.getNetTcpConnection(match);
      
      case 'new-netfirewallrule':
        return this.newNetFirewallRule(match, args);
      
      case 'capture-forensicsnapshot':
        return this.captureForensicSnapshot(match, args);
      
      case 'get-service':
        return this.getService(match);
      
      case 'get-process':
        return this.getProcess(match);
      
      case 'whoami':
        return this.whoami();
      
      case 'clear':
        return { output: '', clear: true };
      
      default:
        return {
          output: `The term '${command}' is not recognized as the name of a cmdlet, function, script file, or operable program.\n`,
          error: true,
        };
    }
  }

  showHelp() {
    return {
      output: `Available Commands:
  Get-EventLog              - View security event log
  Get-NetTcpConnection      - List active network connections
  New-NetFirewallRule       - Block an IP address
  Capture-ForensicSnapshot  - Collect evidence from host
  Get-Service               - List running services
  Get-Process               - List running processes
  whoami                     - Show current user
  clear                      - Clear terminal
  help                       - Show this help\n`,
    };
  }

  getEventLog(match) {
    const output = `TimeGenerated          EntryType   Source                Message
------------------     ---------   ------                -------
1/15/2025 10:30:15 AM  Warning     Security              An account was logged on.
1/15/2025 10:28:42 AM  Warning     Network               Unusual traffic pattern detected.
1/15/2025 10:25:33 AM  Information Windows               Service started: W32Time
1/15/2025 10:23:10 AM  Warning     Security              Failed logon attempt.\n`;
    
    match.aiState.awareness += 2;
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: 'Reviewed security event log',
      timestamp: new Date().toISOString(),
    });
    
    return { output };
  }

  getNetTcpConnection(match) {
    const output = `LocalAddress        LocalPort RemoteAddress       RemotePort State       AppliedSetting
------------        --------- -------------       ---------- -----       -------------
0.0.0.0              445      10.0.2.99            49152      Established Offload
0.0.0.0              3389     10.0.2.15            54321      Established Offload
[::]                 80      0.0.0.0              0          Listen      Offload\n`;
    
    match.aiState.awareness += 3;
    return { output };
  }

  newNetFirewallRule(match, args) {
    if (!args[0]) {
      return { output: 'New-NetFirewallRule: Missing required parameter -DisplayName and -RemoteAddress\n' };
    }
    
    const ip = args[0];
    match.aiState.blockList.push(ip);
    
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: `Blocked IP address ${ip} in firewall`,
      timestamp: new Date().toISOString(),
    });
    
    match.aiState.containmentActive = true;
    
    return {
      output: `Firewall rule created successfully.\nIP ${ip} has been blocked.\n`,
    };
  }

  captureForensicSnapshot(match, args) {
    if (!args[0]) {
      return { output: 'Usage: Capture-ForensicSnapshot <hostname>\n' };
    }
    
    const hostname = args[0];
    const host = match.network.hosts.find(h => h.hostname === hostname);
    
    if (!host) {
      return { output: `Error: Could not locate host ${hostname}\n` };
    }
    
    const evidence = {
      hostname,
      timestamp: new Date().toISOString(),
      hash: this.generateHash(),
      os: host.os,
    };
    
    match.aiState.evidenceCollected.push(evidence);
    match.evidenceChain.push(evidence);
    
    this.gameEngine.addEvent(match, {
      type: 'player_action',
      message: `Collected forensic snapshot from ${hostname}`,
      timestamp: new Date().toISOString(),
    });
    
    return {
      output: `Forensic snapshot captured from ${hostname}\nHash: ${evidence.hash}\nTimestamp: ${evidence.timestamp}\nChain of custody record created.\n`,
    };
  }

  getService(match) {
    return {
      output: `Status   Name               DisplayName
------   ----               -----------
Running  W32Time            Windows Time
Running  MSSQLSERVER         SQL Server
Running  AdobeARMservice     Adobe Acrobat Update Service\n`,
    };
  }

  getProcess(match) {
    return {
      output: `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName
-------  ------    -----      -----     ------     -- -----------
    314     13454    9876      45234       0.45   1234 powershell
    156      4321    2156      12890       0.12   5678 explorer
    89      2345    1024       8765       0.03   9012 svchost\n`,
    };
  }

  whoami() {
    return { output: 'SOC\\defender\n' };
  }

  generateHash() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

module.exports = DefenderCommands;

