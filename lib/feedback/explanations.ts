// Feedback explanations for different types of IOC and scenario questions

export interface FeedbackExplanation {
  correct: string;
  incorrect: string;
  mitreAttackId?: string;
  owaspCategory?: string;
  resources: Array<{ title: string; url: string }>;
}

export const FEEDBACK_EXPLANATIONS: Record<string, FeedbackExplanation> = {
  // IOC Analysis Explanations
  ioc_malicious_ip: {
    correct: "Excellent! You correctly identified this IP address as malicious. The indicators include: connections to known C2 infrastructure, reputation scores from multiple threat intelligence sources, and suspicious network patterns. This IP is associated with active command and control operations.",
    incorrect: "This IP address is actually malicious. Key indicators you may have missed: connections to known C2 infrastructure, reputation scores from multiple threat intelligence sources, suspicious network patterns, and associations with known threat actor campaigns. Always check multiple threat intelligence sources and look for patterns in network behavior.",
    mitreAttackId: "T1071.001",
    owaspCategory: undefined,
    resources: [
      { title: "IP Reputation Checking Guide", url: "/learn/ip-reputation" },
      { title: "Understanding C2 Infrastructure", url: "/learn/c2-infrastructure" }
    ]
  },

  ioc_benign_domain: {
    correct: "Correct! This domain is legitimate. You properly verified the domain registration, SSL certificate validity, and reputation across multiple sources. Legitimate domains typically have proper WHOIS records, valid SSL certificates, and positive reputation scores.",
    incorrect: "This domain is actually benign. It's important not to over-flag legitimate traffic. Indicators of legitimacy include: proper domain registration, valid SSL certificates, positive reputation across multiple sources, and normal DNS resolution patterns. Always verify through multiple reputation sources and consider context.",
    mitreAttackId: undefined,
    owaspCategory: undefined,
    resources: [
      { title: "Domain Reputation Analysis", url: "/learn/domain-analysis" },
      { title: "False Positive Reduction", url: "/learn/false-positives" }
    ]
  },

  ioc_malicious_hash: {
    correct: "Perfect! You correctly identified this file hash as malicious using threat intelligence lookups. The hash appears in multiple threat feeds and sandbox analysis reports. Always verify hashes across multiple sources for accuracy.",
    incorrect: "This file hash is known malware. It appears in threat feeds for multiple malware families and has been analyzed in sandboxes showing malicious behavior. Always check VirusTotal, hybrid-analysis, and other sandboxes when analyzing file hashes.",
    mitreAttackId: "T1204.002",
    owaspCategory: undefined,
    resources: [
      { title: "File Hash Analysis", url: "/learn/hash-analysis" },
      { title: "Sandbox Analysis Tools", url: "/learn/sandbox-tools" }
    ]
  },

  ioc_suspicious_process: {
    correct: "Great work! This process exhibits malicious behavior including: unusual parent-child relationships, execution from non-standard locations, network connections to suspicious IPs, and behavioral indicators consistent with malware.",
    incorrect: "This process is malicious. Red flags include: unusual parent-child relationship (e.g., PowerShell spawned from Word), rare file location (e.g., Temp folder), network connections to suspicious IPs, and behavioral indicators like process injection or credential dumping attempts.",
    mitreAttackId: "T1055",
    owaspCategory: undefined,
    resources: [
      { title: "Process Analysis Guide", url: "/learn/process-analysis" },
      { title: "Behavioral Malware Detection", url: "/learn/behavioral-detection" }
    ]
  },

  // Phishing Analysis
  phishing_spoofed_sender: {
    correct: "Well done! You identified the spoofed sender address. Key indicators: display name mismatch with actual email address, suspicious domain similarity, SPF/DKIM authentication failures, and header analysis revealing inconsistencies.",
    incorrect: "This email has a spoofed sender. Look for: display name vs actual email mismatch (e.g., 'Microsoft Support' but email is from suspicious domain), domain similarity attacks (e.g., microsft.com), SPF/DKIM failures, and header analysis showing routing inconsistencies.",
    mitreAttackId: "T1566.001",
    owaspCategory: "A07:2021",
    resources: [
      { title: "Email Header Analysis", url: "/learn/email-headers" },
      { title: "Phishing Detection Techniques", url: "/learn/phishing-detection" }
    ]
  },

  phishing_malicious_link: {
    correct: "Excellent analysis! You correctly identified the malicious link. URL obfuscation, suspicious TLD, link reputation, and context analysis all indicated threat. Always expand shortened URLs and analyze the destination before clicking.",
    incorrect: "This link is malicious. Indicators include: URL shorteners hiding destination, typosquatting domains, suspicious query parameters, bad reputation scores, and context mismatch (e.g., 'bank login' linking to unrelated domain). Always expand and analyze URLs before clicking.",
    mitreAttackId: "T1566.002",
    owaspCategory: "A03:2021",
    resources: [
      { title: "URL Analysis Fundamentals", url: "/learn/url-analysis" },
      { title: "Link Deobfuscation", url: "/learn/deobfuscation" }
    ]
  },

  // Network Intrusion
  network_port_scan: {
    correct: "Excellent detection! You identified reconnaissance activity. The pattern of connections across multiple ports, high connection rate, and sequential port access is characteristic of network scanning used for vulnerability discovery.",
    incorrect: "This activity represents a port scan. Indicators: connections to sequential ports, high connection rate, pattern of SYN packets without completion, and connections from single source to multiple destinations. Port scans are reconnaissance activities used to discover vulnerable services.",
    mitreAttackId: "T1046",
    owaspCategory: undefined,
    resources: [
      { title: "Network Reconnaissance Detection", url: "/learn/reconnaissance" },
      { title: "Port Scan Patterns", url: "/learn/port-scans" }
    ]
  },

  network_exfiltration: {
    correct: "Great catch! You identified data exfiltration. Large outbound transfers to unusual destinations, connections during off-hours, and data volume anomalies are key indicators of unauthorized data movement.",
    incorrect: "This represents data exfiltration. Look for: unusually large outbound traffic volumes, connections to uncommon geographic locations, transfers during off-hours, encrypted connections to external servers, and data volume anomalies compared to baseline.",
    mitreAttackId: "T1041",
    owaspCategory: "A04:2021",
    resources: [
      { title: "Data Exfiltration Detection", url: "/learn/exfiltration" },
      { title: "Network Traffic Analysis", url: "/learn/traffic-analysis" }
    ]
  },

  // Insider Threat
  insider_privilege_abuse: {
    correct: "Excellent work! You identified privilege abuse. Unauthorized access to sensitive resources, unusual activity patterns, and access outside normal hours are clear indicators of insider threat behavior.",
    incorrect: "This is privilege abuse. Red flags: access outside normal hours, accessing unrelated systems or data, privilege escalation attempts, unusual data access patterns, and activity inconsistent with job role. Insider threats often abuse legitimate credentials.",
    mitreAttackId: "T1078",
    owaspCategory: "A01:2021",
    resources: [
      { title: "Insider Threat Detection", url: "/learn/insider-threats" },
      { title: "User Behavior Analytics", url: "/learn/uba" }
    ]
  },

  // Generic fallback
  generic: {
    correct: "Correct! Your analysis identified the threat correctly. Continue practicing to improve your detection skills and speed.",
    incorrect: "This was incorrect. Review the scenario details and consider the context, indicators, and patterns present. Practice with similar scenarios to improve your detection accuracy.",
    mitreAttackId: undefined,
    owaspCategory: undefined,
    resources: [
      { title: "General Threat Detection Guide", url: "/learn/threat-detection" }
    ]
  }
};

/**
 * Get feedback explanation for a specific question type
 */
export function getFeedbackExplanation(feedbackKey: string): FeedbackExplanation {
  return FEEDBACK_EXPLANATIONS[feedbackKey] || FEEDBACK_EXPLANATIONS.generic;
}

/**
 * Generate feedback key from IOC details
 */
export function generateFeedbackKey(
  ioc: string,
  type: string,
  isCorrect: boolean,
  actualClassification: 'malicious' | 'benign',
  scenarioType?: string
): string {
  // Try scenario-specific keys first
  if (scenarioType) {
    const scenarioKey = `${scenarioType}_${type}_${actualClassification}`;
    if (FEEDBACK_EXPLANATIONS[scenarioKey]) {
      return scenarioKey;
    }
  }

  // Generate type-based key
  const baseKey = `ioc_${actualClassification}_${type}`;
  if (FEEDBACK_EXPLANATIONS[baseKey]) {
    return baseKey;
  }

  // Fallback to generic type-based keys
  if (type === 'ip' && actualClassification === 'malicious') {
    return 'ioc_malicious_ip';
  }
  if (type === 'domain' && actualClassification === 'benign') {
    return 'ioc_benign_domain';
  }
  if (type === 'hash' && actualClassification === 'malicious') {
    return 'ioc_malicious_hash';
  }
  if (type === 'pid' && actualClassification === 'malicious') {
    return 'ioc_suspicious_process';
  }

  // Default to generic
  return 'generic';
}

