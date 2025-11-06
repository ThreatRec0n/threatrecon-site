// MITRE ATT&CK framework integration

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
}

// Common MITRE ATT&CK techniques for threat hunting
export const MITRE_TECHNIQUES: Record<string, MitreTechnique> = {
  'T1059.001': {
    id: 'T1059.001',
    name: 'PowerShell',
    tactic: 'Execution',
    description: 'Adversaries may abuse PowerShell commands and scripts for execution.',
    url: 'https://attack.mitre.org/techniques/T1059/001/',
  },
  'T1071.001': {
    id: 'T1071.001',
    name: 'Web Protocols',
    tactic: 'Command and Control',
    description: 'Adversaries may communicate using application layer protocols to avoid detection.',
    url: 'https://attack.mitre.org/techniques/T1071/001/',
  },
  'T1048': {
    id: 'T1048',
    name: 'Exfiltration Over Alternative Protocol',
    tactic: 'Exfiltration',
    description: 'Adversaries may steal data by exfiltrating it over a different protocol than the command and control channel.',
    url: 'https://attack.mitre.org/techniques/T1048/',
  },
  'T1021.002': {
    id: 'T1021.002',
    name: 'SMB/Windows Admin Shares',
    tactic: 'Lateral Movement',
    description: 'Adversaries may use Valid Accounts to interact with a remote network share using Server Message Block (SMB).',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
  },
  'T1078': {
    id: 'T1078',
    name: 'Valid Accounts',
    tactic: 'Defense Evasion, Persistence, Privilege Escalation, Initial Access',
    description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.',
    url: 'https://attack.mitre.org/techniques/T1078/',
  },
  'T1566.001': {
    id: 'T1566.001',
    name: 'Phishing: Spearphishing Attachment',
    tactic: 'Initial Access',
    description: 'Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems.',
    url: 'https://attack.mitre.org/techniques/T1566/001/',
  },
  'T1055': {
    id: 'T1055',
    name: 'Process Injection',
    tactic: 'Defense Evasion, Privilege Escalation',
    description: 'Adversaries may inject code into processes in order to evade process-based defenses as well as possibly elevate privileges.',
    url: 'https://attack.mitre.org/techniques/T1055/',
  },
  'T1070.004': {
    id: 'T1070.004',
    name: 'Indicator Removal: File Deletion',
    tactic: 'Defense Evasion',
    description: 'Adversaries may delete files left behind by the actions of their intrusion activity.',
    url: 'https://attack.mitre.org/techniques/T1070/004/',
  },
};

export function getMitreTechnique(id: string): MitreTechnique | undefined {
  return MITRE_TECHNIQUES[id];
}

export function getTechniquesByTactic(tactic: string): MitreTechnique[] {
  return Object.values(MITRE_TECHNIQUES).filter(t => 
    t.tactic.toLowerCase().includes(tactic.toLowerCase())
  );
}

