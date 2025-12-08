export interface MITRETechnique {
  id: string; // "T1059.001"
  name: string;
  tactic: string;
  description: string;
  redFlags: string[];
  investigationSteps: string[];
  realWorldExample: string;
  defenseRecommendations: string[];
  relatedTechniques: string[];
  commonTools: string[];
  indicators: string[];
}

export const MITRE_TECHNIQUES: Record<string, MITRETechnique> = {
  'T1059.001': {
    id: 'T1059.001',
    name: 'PowerShell',
    tactic: 'Execution',
    description: 'Adversaries abuse PowerShell commands and scripts for execution. PowerShell is a powerful interactive command-line interface and scripting environment included in Windows.',
    redFlags: [
      'Base64 encoded commands (-EncodedCommand, -enc, -e flags)',
      'Download cradles (DownloadString, DownloadFile, Invoke-WebRequest)',
      'Execution policy bypass (-ExecutionPolicy Bypass)',
      'Hidden window execution (-WindowStyle Hidden)',
      'Obfuscated or randomized variable names',
      'Uncommon parent processes (Excel, Word, WScript launching PowerShell)'
    ],
    investigationSteps: [
      '1. Check the parent process - What launched PowerShell? (Should be legitimate like explorer.exe or cmd.exe)',
      '2. Decode any Base64 encoded commands - Look for suspicious URLs, IPs, or file paths',
      '3. Review command-line arguments - Check for bypass flags, hidden windows, or encoded commands',
      '4. Look for network connections immediately after execution',
      '5. Check for file creation in suspicious locations (%TEMP%, %APPDATA%)',
      '6. Verify the user who executed it - Was this expected for their role?'
    ],
    realWorldExample: 'In the 2017 NotPetya ransomware attack, PowerShell was used to execute PsExec for lateral movement. The command was heavily obfuscated with Base64 encoding to bypass detection systems.',
    defenseRecommendations: [
      'Enable PowerShell logging (Module, Script Block, and Transcription logging)',
      'Use Windows Defender Application Control (WDAC) to restrict PowerShell execution',
      'Implement application whitelisting to control which scripts can run',
      'Monitor for common PowerShell abuse patterns',
      'Restrict PowerShell remoting to authorized administrators only',
      'Deploy PowerShell Constrained Language Mode in non-admin contexts'
    ],
    relatedTechniques: ['T1059.003', 'T1059.005', 'T1059.006', 'T1027'],
    commonTools: ['PowerShell Empire', 'Cobalt Strike', 'Metasploit', 'Covenant'],
    indicators: [
      'powershell.exe with -enc flag',
      'IEX (Invoke-Expression) usage',
      'DownloadString/DownloadFile',
      'bypass execution policy',
      'hidden window style'
    ]
  },
  
  'T1071.001': {
    id: 'T1071.001',
    name: 'Web Protocols',
    tactic: 'Command and Control',
    description: 'Adversaries communicate using application layer protocols to avoid detection and network filtering by blending in with existing traffic.',
    redFlags: [
      'Outbound connections to recently registered domains (< 30 days old)',
      'Communication to uncommon geographic locations',
      'High-frequency beaconing patterns (regular intervals)',
      'Unusual user-agents or HTTP headers',
      'Large data transfers to external IPs',
      'TLS/SSL connections to suspicious domains'
    ],
    investigationSteps: [
      '1. Identify the destination IP/domain - Check registration date, geolocation, reputation',
      '2. Analyze traffic patterns - Is it beaconing at regular intervals?',
      '3. Review process that initiated connection - Legitimate application or suspicious process?',
      '4. Check HTTP headers and user-agent strings for anomalies',
      '5. Calculate data transfer volumes - Upload vs download ratio',
      '6. Cross-reference with threat intelligence feeds'
    ],
    realWorldExample: 'APT28 (Fancy Bear) uses custom malware that communicates with C2 servers via HTTPS to blend in with normal web traffic. They often use compromised legitimate websites as C2 infrastructure.',
    defenseRecommendations: [
      'Implement SSL/TLS inspection on egress traffic',
      'Use DNS sinkholing for known malicious domains',
      'Deploy network behavior analysis to detect beaconing',
      'Maintain updated threat intelligence feeds',
      'Monitor for connections to newly registered domains',
      'Use DNS filtering to block malicious domain categories'
    ],
    relatedTechniques: ['T1071.002', 'T1071.003', 'T1071.004', 'T1573'],
    commonTools: ['Cobalt Strike', 'Metasploit', 'Empire', 'Pupy'],
    indicators: [
      'Regular beaconing intervals',
      'Unusual port usage (443 from non-browser process)',
      'Self-signed or invalid certificates',
      'Recently registered domains'
    ]
  },
  
  'T1003': {
    id: 'T1003',
    name: 'OS Credential Dumping',
    tactic: 'Credential Access',
    description: 'Adversaries attempt to dump credentials to obtain account login information in the form of a hash or cleartext password.',
    redFlags: [
      'Suspicious LSASS.exe memory access',
      'Mimikatz indicators (sekurlsa, logonpasswords)',
      'Unexpected processes reading from SAM/SYSTEM registry hives',
      'Volume Shadow Copy creation for credential theft',
      'DCSync activity (replicating Active Directory)',
      'ProcDump.exe or similar tools dumping LSASS'
    ],
    investigationSteps: [
      '1. Identify what accessed LSASS - Check process that opened handle to lsass.exe',
      '2. Review command line - Look for Mimikatz commands or credential dumping tools',
      '3. Check for new services or scheduled tasks (persistence)',
      '4. Search for cleartext passwords in memory dumps',
      '5. Audit recent account logins - Has lateral movement occurred?',
      '6. Review Active Directory replication logs for DCSync'
    ],
    realWorldExample: 'In most ransomware attacks, threat actors use Mimikatz to dump credentials from LSASS memory, then use those credentials for lateral movement across the network before deploying ransomware.',
    defenseRecommendations: [
      'Enable LSA Protection (RunAsPPL)',
      'Deploy Credential Guard on Windows 10/11',
      'Disable WDigest authentication',
      'Use strong, unique passwords for privileged accounts',
      'Monitor for LSASS access from non-system processes',
      'Implement least privilege and just-in-time admin access'
    ],
    relatedTechniques: ['T1003.001', 'T1003.002', 'T1003.003', 'T1558'],
    commonTools: ['Mimikatz', 'LaZagne', 'ProcDump', 'gsecdump', 'fgdump'],
    indicators: [
      'sekurlsa::logonpasswords',
      'lsass.exe memory dump',
      'procdump.exe -ma lsass.exe',
      'vssadmin create shadow'
    ]
  },
  
  'T1021': {
    id: 'T1021',
    name: 'Remote Services',
    tactic: 'Lateral Movement',
    description: 'Adversaries use Valid Accounts to log into a service specifically designed to accept remote connections.',
    redFlags: [
      'RDP connections from unusual source IPs',
      'PSExec execution to multiple hosts',
      'WMI remote command execution',
      'Multiple SMB connections in short timeframe',
      'Login from service accounts outside business hours',
      'Administrator login to workstations (should be servers only)'
    ],
    investigationSteps: [
      '1. Identify source and destination systems',
      '2. Check account used - Is it appropriate for this connection?',
      '3. Review timing - Business hours or off-hours?',
      '4. Look for privilege escalation before lateral movement',
      '5. Map the lateral movement path across hosts',
      '6. Check for additional malicious activity on destination hosts'
    ],
    realWorldExample: 'Ryuk ransomware operators use RDP and PSExec with stolen administrator credentials to move laterally across networks, often spending weeks mapping the environment before deploying ransomware.',
    defenseRecommendations: [
      'Disable RDP where not needed',
      'Implement network segmentation',
      'Use jump servers for administrative access',
      'Enable MFA on remote access services',
      'Monitor for unusual lateral movement patterns',
      'Restrict SMB and WMI to authorized systems only'
    ],
    relatedTechniques: ['T1021.001', 'T1021.002', 'T1021.006', 'T1550'],
    commonTools: ['PSExec', 'WMI', 'RDP', 'SSH'],
    indicators: [
      'psexec.exe \\\\remote-host',
      'wmic /node:',
      'net use \\\\',
      'Multiple failed RDP attempts'
    ]
  },
  
  'T1486': {
    id: 'T1486',
    name: 'Data Encrypted for Impact',
    tactic: 'Impact',
    description: 'Adversaries encrypt data on target systems to interrupt availability. Ransomware is the most common implementation.',
    redFlags: [
      'Mass file encryption activity (thousands of files)',
      'New file extensions (.locked, .encrypted, .ryuk, etc.)',
      'Ransom notes (README.txt, HOW_TO_DECRYPT.txt)',
      'Shadow copy deletion (vssadmin delete shadows)',
      'Backup deletion or encryption',
      'Termination of backup services and databases'
    ],
    investigationSteps: [
      '1. IMMEDIATELY ISOLATE affected systems from network',
      '2. Identify ransomware variant from ransom note or file extensions',
      '3. Check if backups are intact and unencrypted',
      '4. Map scope - How many systems are affected?',
      '5. Review lateral movement logs - Where did it spread from?',
      '6. DO NOT PAY RANSOM - Notify law enforcement and cybersecurity insurance'
    ],
    realWorldExample: 'WannaCry ransomware (2017) spread via EternalBlue exploit, encrypted over 200,000 computers across 150 countries, causing billions in damages. It left ransom notes demanding Bitcoin payment.',
    defenseRecommendations: [
      'Maintain offline, immutable backups (3-2-1 backup rule)',
      'Implement EDR with behavioral detection',
      'Restrict access to backup systems',
      'Deploy honeypot files to detect early encryption',
      'Disable SMBv1 and patch regularly',
      'User education on phishing (common ransomware delivery)'
    ],
    relatedTechniques: ['T1490', 'T1489', 'T1491', 'T1565'],
    commonTools: ['REvil', 'LockBit', 'Conti', 'Ryuk', 'BlackCat'],
    indicators: [
      'vssadmin delete shadows /all',
      'bcdedit /set {default} recoveryenabled no',
      'wbadmin delete catalog',
      'Mass file modifications'
    ]
  },
  
  'T1055': {
    id: 'T1055',
    name: 'Process Injection',
    tactic: 'Defense Evasion',
    description: 'Process injection is a method of executing arbitrary code in the address space of a separate live process.',
    redFlags: [
      'Unexpected memory allocation in legitimate processes',
      'Code injection into svchost.exe, explorer.exe, or other system processes',
      'Hollowed processes (legitimate process with malicious code)',
      'CreateRemoteThread API calls',
      'Reflective DLL injection indicators',
      'Unusual parent-child process relationships'
    ],
    investigationSteps: [
      '1. Identify the target process being injected into',
      '2. Find the source process performing injection',
      '3. Check for DLL injection or shellcode in memory',
      '4. Review API calls (VirtualAllocEx, WriteProcessMemory, CreateRemoteThread)',
      '5. Extract memory dumps for malware analysis',
      '6. Check for persistence mechanisms'
    ],
    realWorldExample: 'TrickBot malware injects its payload into legitimate Windows processes like svchost.exe to evade detection and maintain persistence on infected systems.',
    defenseRecommendations: [
      'Enable Sysmon for detailed process monitoring',
      'Deploy EDR with process injection detection',
      'Use Microsoft Defender Exploit Guard',
      'Monitor API calls associated with injection',
      'Enable Control Flow Guard (CFG)',
      'Implement code integrity policies'
    ],
    relatedTechniques: ['T1055.001', 'T1055.002', 'T1055.003', 'T1055.012'],
    commonTools: ['Meterpreter', 'Cobalt Strike', 'Process Hacker', 'Reflective DLL Injection'],
    indicators: [
      'VirtualAllocEx + WriteProcessMemory + CreateRemoteThread',
      'Unusual memory regions in legitimate processes',
      'Process hollowing (suspended process replaced)'
    ]
  }
};

export function getTechniqueById(id: string): MITRETechnique | undefined {
  return MITRE_TECHNIQUES[id];
}

export function getTechniquesByTactic(tactic: string): MITRETechnique[] {
  return Object.values(MITRE_TECHNIQUES).filter(tech => tech.tactic === tactic);
}

export function getAllTechniques(): MITRETechnique[] {
  return Object.values(MITRE_TECHNIQUES);
}

