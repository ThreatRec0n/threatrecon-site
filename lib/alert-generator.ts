// Realistic Alert Generator - Creates alerts matching real SOC environments

import { createRealisticAlert, type Alert, type AlertSeverity, type AlertSource } from './soc-alert-types';
import type { ThreatIntelMatch } from './soc-alert-types';

// Realistic alert templates based on actual SOC alerts
const ALERT_TEMPLATES = {
  // True Positive Alerts
  truePositive: [
    {
      title: 'Multiple Failed Login Attempts - Domain Controller',
      severity: 'High' as AlertSeverity,
      source: 'AD' as AlertSource,
      rule: 'Brute Force Detection - Domain Controller',
      containmentRequired: true,
      mitreTechniques: ['T1110.001', 'T1078'],
      generateIntel: () => [
        { type: 'ip' as const, value: generateExternalIP(), source: 'AbuseIPDB', reputation: 'malicious' as const, confidence: 85 },
      ],
    },
    {
      title: 'Anomalous Outbound Traffic to Known C2 IP',
      severity: 'Critical' as AlertSeverity,
      source: 'Firewall' as AlertSource,
      rule: 'C2 Communication Detected',
      containmentRequired: true,
      mitreTechniques: ['T1071.001', 'T1043'],
      generateIntel: () => [
        { type: 'ip' as const, value: '185.220.101.47', source: 'VirusTotal', reputation: 'malicious' as const, confidence: 95 },
        { type: 'ip' as const, value: '185.220.101.47', source: 'AlienVault OTX', reputation: 'malicious' as const, confidence: 90 },
      ],
    },
    {
      title: 'Unsigned PowerShell Execution with Base64 Encoding',
      severity: 'High' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Suspicious PowerShell Execution',
      containmentRequired: false,
      mitreTechniques: ['T1059.001', 'T1027'],
      generateIntel: () => [],
    },
    {
      title: 'Potential Data Exfiltration - Large File Transfer',
      severity: 'Critical' as AlertSeverity,
      source: 'Proxy' as AlertSource,
      rule: 'Data Exfiltration Detection',
      containmentRequired: true,
      mitreTechniques: ['T1048', 'T1041'],
      generateIntel: () => [
        { type: 'domain' as const, value: 'suspicious-cloud-storage.com', source: 'VirusTotal', reputation: 'suspicious' as const, confidence: 70 },
      ],
    },
    {
      title: 'Credential Dumping Tool Detected',
      severity: 'Critical' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Credential Access Tool',
      containmentRequired: true,
      mitreTechniques: ['T1003.001', 'T1003.002'],
      generateIntel: () => [
        { type: 'hash' as const, value: 'a1b2c3d4e5f6...', source: 'VirusTotal', reputation: 'malicious' as const, confidence: 98 },
      ],
    },
    {
      title: 'Lateral Movement via SMB Detected',
      severity: 'High' as AlertSeverity,
      source: 'SIEM Correlation' as AlertSource,
      rule: 'Lateral Movement - SMB',
      containmentRequired: true,
      mitreTechniques: ['T1021.002', 'T1078'],
      generateIntel: () => [],
    },
    {
      title: 'Ransomware Encryption Activity Detected',
      severity: 'Critical' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Ransomware Behavior',
      containmentRequired: true,
      mitreTechniques: ['T1486', 'T1490'],
      generateIntel: () => [
        { type: 'hash' as const, value: '7f8e9d0c1b2a...', source: 'VirusTotal', reputation: 'malicious' as const, confidence: 99 },
      ],
    },
  ],
  
  // False Positive Alerts (70% of alerts)
  falsePositive: [
    {
      title: 'Scheduled Task Execution - PowerShell',
      severity: 'Low' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Suspicious PowerShell Execution',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Legitimate scheduled task running PowerShell script for system maintenance',
    },
    {
      title: 'User Access to Blocked Domain',
      severity: 'Informational' as AlertSeverity,
      source: 'Proxy' as AlertSource,
      rule: 'Block-Suspicious-Domains',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [
        { type: 'domain' as const, value: 'example.com', source: 'VirusTotal', reputation: 'clean' as const, confidence: 100 },
      ],
      isFalsePositive: true,
      explanation: 'User attempted to access domain blocked by policy, but domain is legitimate',
    },
    {
      title: 'Large File Download - Software Update',
      severity: 'Low' as AlertSeverity,
      source: 'Proxy' as AlertSource,
      rule: 'Data Exfiltration Detection',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Large file transfer is legitimate software update',
    },
    {
      title: 'Network Scan from Vulnerability Scanner',
      severity: 'Medium' as AlertSeverity,
      source: 'IDS' as AlertSource,
      rule: 'Port Scan Detection',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [
        { type: 'ip' as const, value: generateInternalIP(), source: 'Internal', reputation: 'clean' as const, confidence: 100 },
      ],
      isFalsePositive: true,
      explanation: 'Port scan originates from authorized vulnerability scanner',
    },
    {
      title: 'Antivirus Process Accessing LSASS',
      severity: 'Medium' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Credential Access Tool',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Legitimate antivirus process accessing LSASS for security scanning',
    },
    {
      title: 'Administrative PowerShell Script Execution',
      severity: 'Low' as AlertSeverity,
      source: 'EDR' as AlertSource,
      rule: 'Suspicious PowerShell Execution',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Authorized administrator running legitimate PowerShell script',
    },
    {
      title: 'Backup Process Network Activity',
      severity: 'Low' as AlertSeverity,
      source: 'Firewall' as AlertSource,
      rule: 'Anomalous Network Traffic',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Legitimate backup process transferring data to backup server',
    },
    {
      title: 'Email Gateway Quarantine Notification',
      severity: 'Informational' as AlertSeverity,
      source: 'Email Gateway' as AlertSource,
      rule: 'Suspicious Email Attachment',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Email quarantined due to policy, but attachment is safe',
    },
    {
      title: 'DNS Query to New Domain',
      severity: 'Informational' as AlertSeverity,
      source: 'DNS' as AlertSource,
      rule: 'Suspicious DNS Query',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [
        { type: 'domain' as const, value: 'new-legitimate-site.com', source: 'VirusTotal', reputation: 'clean' as const, confidence: 100 },
      ],
      isFalsePositive: true,
      explanation: 'User accessing newly registered but legitimate domain',
    },
    {
      title: 'Cloud API Activity - Normal Operations',
      severity: 'Low' as AlertSeverity,
      source: 'Cloud' as AlertSource,
      rule: 'Anomalous Cloud Activity',
      containmentRequired: false,
      mitreTechniques: [],
      generateIntel: () => [],
      isFalsePositive: true,
      explanation: 'Normal cloud service API calls from authorized application',
    },
  ],
};

function generateExternalIP(): string {
  const octets = Array.from({ length: 4 }, () => Math.floor(Math.random() * 255));
  return octets.join('.');
}

function generateInternalIP(): string {
  // Generate internal IP in 10.0.0.0/8 or 192.168.0.0/16 range
  const ranges = [
    () => `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `172.${16 + Math.floor(Math.random() * 16)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  ];
  return ranges[Math.floor(Math.random() * ranges.length)]();
}

function generateHostname(): string {
  const prefixes = ['WORKSTATION', 'LAPTOP', 'SERVER', 'DC'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  return `${prefix}-${number}`;
}

// Generate a batch of realistic alerts
export function generateAlertBatch(count: number = 30): Alert[] {
  const alerts: Alert[] = [];
  const distribution = {
    realThreats: Math.floor(count * 0.3),
    falsePositives: Math.floor(count * 0.7),
  };
  
  // Generate real threat alerts
  const truePositiveTemplates = ALERT_TEMPLATES.truePositive;
  for (let i = 0; i < distribution.realThreats; i++) {
    const template = truePositiveTemplates[Math.floor(Math.random() * truePositiveTemplates.length)];
    const hostname = generateHostname();
    const intel = template.generateIntel();
    
    const alert = createRealisticAlert(
      template.title,
      template.severity,
      template.source,
      template.rule,
      {
        affectedAssets: [hostname, generateExternalIP()],
        containmentRequired: template.containmentRequired,
        mitreTechniques: template.mitreTechniques,
        threatIntelMatches: intel,
      }
    );
    
    alerts.push(alert);
  }
  
  // Generate false positive alerts
  const falsePositiveTemplates = ALERT_TEMPLATES.falsePositive;
  for (let i = 0; i < distribution.falsePositives; i++) {
    const template = falsePositiveTemplates[Math.floor(Math.random() * falsePositiveTemplates.length)];
    const hostname = generateHostname();
    const intel = template.generateIntel();
    
    const alert = createRealisticAlert(
      template.title,
      template.severity,
      template.source,
      template.rule,
      {
        affectedAssets: [hostname],
        containmentRequired: template.containmentRequired,
        mitreTechniques: template.mitreTechniques,
        threatIntelMatches: intel,
      }
    );
    
    // Mark as false positive in notes
    alert.notes = [
      {
        id: `note-${Date.now()}`,
        author: 'System',
        timestamp: new Date(),
        content: template.explanation || 'False positive - requires investigation',
        type: 'investigation',
      },
    ];
    
    alerts.push(alert);
  }
  
  // Add some correlation hints (related alerts)
  const relatedGroups: Alert[][] = [];
  for (let i = 0; i < Math.floor(alerts.length / 5); i++) {
    const groupSize = Math.floor(Math.random() * 3) + 2;
    const group: Alert[] = [];
    for (let j = 0; j < groupSize && alerts.length > 0; j++) {
      const randomIndex = Math.floor(Math.random() * alerts.length);
      group.push(alerts.splice(randomIndex, 1)[0]);
    }
    if (group.length > 0) {
      const alertIds = group.map(a => a.id);
      group.forEach(alert => {
        alert.relatedAlerts = alertIds.filter(id => id !== alert.id);
      });
      relatedGroups.push(group);
    }
  }
  
  // Shuffle alerts
  return alerts.sort(() => Math.random() - 0.5);
}

// Generate alerts with correlation hints
export function generateCorrelatedAlerts(baseAlert: Alert, relatedCount: number = 2): Alert[] {
  const related: Alert[] = [];
  const baseHostname = baseAlert.affectedAssets[0] || generateHostname();
  
  for (let i = 0; i < relatedCount; i++) {
    const template = ALERT_TEMPLATES.truePositive[Math.floor(Math.random() * ALERT_TEMPLATES.truePositive.length)];
    const intel = template.generateIntel();
    
    const alert = createRealisticAlert(
      template.title,
      template.severity,
      template.source,
      template.rule,
      {
        affectedAssets: [baseHostname],
        containmentRequired: template.containmentRequired,
        mitreTechniques: template.mitreTechniques,
        threatIntelMatches: intel,
        relatedAlerts: [baseAlert.id],
      }
    );
    
    related.push(alert);
  }
  
  // Update base alert with related alerts
  baseAlert.relatedAlerts = related.map(a => a.id);
  
  return [baseAlert, ...related];
}


