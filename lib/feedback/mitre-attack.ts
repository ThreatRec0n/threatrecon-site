// MITRE ATT&CK technique definitions for educational references

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  url: string;
}

export const MITRE_ATTACK_TECHNIQUES: Record<string, MitreTechnique> = {
  "T1071.001": {
    id: "T1071.001",
    name: "Application Layer Protocol: Web Protocols",
    tactic: "Command and Control",
    description: "Adversaries may communicate using application layer protocols associated with web traffic to avoid detection. This includes HTTP/HTTPS protocols commonly used for C2 communication.",
    url: "https://attack.mitre.org/techniques/T1071/001/"
  },
  "T1566.001": {
    id: "T1566.001",
    name: "Phishing: Spearphishing Attachment",
    tactic: "Initial Access",
    description: "Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems. The attachment may contain malware or exploit code.",
    url: "https://attack.mitre.org/techniques/T1566/001/"
  },
  "T1566.002": {
    id: "T1566.002",
    name: "Phishing: Spearphishing Link",
    tactic: "Initial Access",
    description: "Adversaries may send spearphishing emails with a malicious link to elicit sensitive information or gain access to victim systems. Links may lead to credential harvesting sites or malware downloads.",
    url: "https://attack.mitre.org/techniques/T1566/002/"
  },
  "T1055": {
    id: "T1055",
    name: "Process Injection",
    tactic: "Defense Evasion, Privilege Escalation",
    description: "Adversaries may inject code into processes to evade detection and gain elevated privileges. This technique allows malicious code to run within the context of legitimate processes.",
    url: "https://attack.mitre.org/techniques/T1055/"
  },
  "T1204.002": {
    id: "T1204.002",
    name: "User Execution: Malicious File",
    tactic: "Execution",
    description: "Adversaries may rely upon user actions to execute malicious files. This includes tricking users into opening malicious attachments or downloading and executing malware.",
    url: "https://attack.mitre.org/techniques/T1204/002/"
  },
  "T1046": {
    id: "T1046",
    name: "Network Service Scanning",
    tactic: "Discovery",
    description: "Adversaries may scan victim networks for services to identify potential vulnerabilities. This reconnaissance activity helps attackers map the target environment.",
    url: "https://attack.mitre.org/techniques/T1046/"
  },
  "T1041": {
    id: "T1041",
    name: "Exfiltration Over C2 Channel",
    tactic: "Exfiltration",
    description: "Adversaries may steal data by exfiltrating over their existing command and control channel. This allows data theft while maintaining communication with the attacker's infrastructure.",
    url: "https://attack.mitre.org/techniques/T1041/"
  },
  "T1078": {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Defense Evasion, Persistence, Privilege Escalation, Initial Access",
    description: "Adversaries may obtain and abuse credentials of existing accounts to gain access, maintain persistence, and evade detection. This includes both local and domain accounts.",
    url: "https://attack.mitre.org/techniques/T1078/"
  },
  "T1003": {
    id: "T1003",
    name: "OS Credential Dumping",
    tactic: "Credential Access",
    description: "Adversaries may attempt to dump credentials to obtain account login and credential material, normally in the form of a hash or a clear text password, from the operating system and software.",
    url: "https://attack.mitre.org/techniques/T1003/"
  },
  "T1021": {
    id: "T1021",
    name: "Remote Services",
    tactic: "Lateral Movement",
    description: "Adversaries may use remote services to move between systems in a network. This includes RDP, SSH, and other remote access protocols.",
    url: "https://attack.mitre.org/techniques/T1021/"
  }
};

/**
 * Get MITRE ATT&CK technique details by ID
 */
export function getMitreTechnique(techniqueId: string): MitreTechnique | undefined {
  return MITRE_ATTACK_TECHNIQUES[techniqueId];
}

