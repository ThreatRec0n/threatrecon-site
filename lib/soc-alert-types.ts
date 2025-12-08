// Enhanced SOC Alert Types with SLA, Ticket Management, and Realistic Workflows

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type AlertSource = 'EDR' | 'SIEM Correlation' | 'IDS' | 'Email Gateway' | 'Firewall' | 'Proxy' | 'Cloud' | 'DNS' | 'AD' | 'Threat Intel';
export type AlertStatus = 'New' | 'Investigating' | 'Escalated' | 'Closed' | 'False Positive';
export type SLATimerStatus = 'OnTime' | 'Warning' | 'Breached';

export interface SLATimer {
  deadline: Date;
  remaining: number; // minutes
  status: SLATimerStatus;
  investigationDeadline: Date;
  containmentDeadline?: Date;
}

export interface Alert {
  id: string;
  ticketNumber: string; // Format: "INC-2024-123456"
  title: string;
  severity: AlertSeverity;
  alertSource: AlertSource;
  detectionRule: string; // Actual rule name like "Suspicious PowerShell Execution"
  affectedAssets: string[]; // Hostnames, IPs
  assignedTo: string; // "Unassigned" | "Your Queue" | "Tier 2"
  status: AlertStatus;
  slaTimer: SLATimer;
  createdAt: Date;
  priority: number; // Calculated score 0-100
  containmentRequired: boolean;
  relatedAlerts: string[]; // IDs of potentially related alerts
  initialContext: string; // Brief description
  
  // Investigation context
  events?: string[]; // Event IDs related to this alert
  iocs?: {
    ips: string[];
    domains: string[];
    hashes: string[];
    processes: string[];
  };
  
  // MITRE mapping
  mitreTechniques?: string[];
  mitreTactics?: string[];
  
  // Notes and comments
  notes?: AlertNote[];
  
  // Threat intelligence matches
  threatIntelMatches?: ThreatIntelMatch[];
}

export interface AlertNote {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
  type: 'investigation' | 'escalation' | 'resolution' | 'comment';
}

export interface ThreatIntelMatch {
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  source: string;
  reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  confidence: number; // 0-100
}

// SLA Requirements by Severity
export const SLA_REQUIREMENTS: Record<AlertSeverity, { investigationTime: number; containmentTime: number }> = {
  Critical: { investigationTime: 15, containmentTime: 30 }, // minutes
  High: { investigationTime: 60, containmentTime: 120 },
  Medium: { investigationTime: 240, containmentTime: 480 },
  Low: { investigationTime: 1440, containmentTime: 2880 },
  Informational: { investigationTime: 2880, containmentTime: 5760 },
};

// Generate ticket number
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const number = Math.floor(Math.random() * 900000) + 100000;
  return `INC-${year}-${number}`;
}

// Calculate SLA timer
export function calculateSLATimer(severity: AlertSeverity, createdAt: Date): SLATimer {
  const requirements = SLA_REQUIREMENTS[severity];
  const investigationDeadline = new Date(createdAt.getTime() + requirements.investigationTime * 60000);
  const containmentDeadline = new Date(createdAt.getTime() + requirements.containmentTime * 60000);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((investigationDeadline.getTime() - now.getTime()) / 60000));
  
  let status: SLATimerStatus = 'OnTime';
  if (remaining <= 0) {
    status = 'Breached';
  } else if (remaining <= requirements.investigationTime * 0.2) {
    status = 'Warning';
  }
  
  return {
    deadline: investigationDeadline,
    remaining,
    status,
    investigationDeadline,
    containmentDeadline,
  };
}

// Calculate priority score (0-100)
export function calculatePriority(alert: Partial<Alert>): number {
  let score = 0;
  
  // Base score from severity
  const severityScores: Record<AlertSeverity, number> = {
    Critical: 100,
    High: 75,
    Medium: 50,
    Low: 25,
    Informational: 10,
  };
  score += severityScores[alert.severity || 'Low'];
  
  // Boost for containment required
  if (alert.containmentRequired) {
    score += 10;
  }
  
  // Boost for related alerts (potential campaign)
  if (alert.relatedAlerts && alert.relatedAlerts.length > 0) {
    score += Math.min(alert.relatedAlerts.length * 5, 15);
  }
  
  // Boost for threat intel matches
  if (alert.threatIntelMatches && alert.threatIntelMatches.length > 0) {
    const maliciousMatches = alert.threatIntelMatches.filter(m => m.reputation === 'malicious').length;
    score += maliciousMatches * 10;
  }
  
  // Reduce for time remaining (urgency)
  if (alert.slaTimer) {
    const timeRemainingPercent = alert.slaTimer.remaining / (SLA_REQUIREMENTS[alert.severity || 'Low'].investigationTime);
    if (timeRemainingPercent < 0.2) {
      score += 15; // Urgent!
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

// Create realistic alert
export function createRealisticAlert(
  title: string,
  severity: AlertSeverity,
  source: AlertSource,
  rule: string,
  options?: {
    affectedAssets?: string[];
    containmentRequired?: boolean;
    relatedAlerts?: string[];
    mitreTechniques?: string[];
    threatIntelMatches?: ThreatIntelMatch[];
  }
): Alert {
  const createdAt = new Date();
  const ticketNumber = generateTicketNumber();
  const slaTimer = calculateSLATimer(severity, createdAt);
  
  const alert: Alert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ticketNumber,
    title,
    severity,
    alertSource: source,
    detectionRule: rule,
    affectedAssets: options?.affectedAssets || [],
    assignedTo: 'Unassigned',
    status: 'New',
    slaTimer,
    createdAt,
    priority: 0, // Will be calculated
    containmentRequired: options?.containmentRequired || false,
    relatedAlerts: options?.relatedAlerts || [],
    initialContext: `${rule} detected on ${options?.affectedAssets?.[0] || 'unknown host'}`,
    mitreTechniques: options?.mitreTechniques || [],
    threatIntelMatches: options?.threatIntelMatches || [],
  };
  
  alert.priority = calculatePriority(alert);
  
  return alert;
}


