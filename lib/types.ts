// Core types for the threat hunting platform

// Type definitions
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type Status = 'New' | 'Open' | 'InProgress' | 'Resolved' | 'Closed' | 'False Positive';

export type ScenarioType = 
  | 'malware-infection'
  | 'insider-threat'
  | 'data-exfiltration'
  | 'lateral-movement'
  | 'web-compromise'
  | 'phishing'
  | 'ransomware'
  | 'command-control';

export type AlertClassification = 'true-positive' | 'false-positive' | 'true-negative' | 'false-negative' | 'unclassified';

export interface SIEMEvent {
  id: string;
  timestamp: string;
  sourceIP: string;
  destinationIP: string;
  eventType: string;
  message: string;
  // Enhanced fields for simulation engine
  source?: 'sysmon' | 'zeek' | 'suricata' | 'edr' | 'cloudtrail' | 'windows-event';
  scenario_id?: string;
  session_id?: string;
  technique_id?: string; // MITRE ATT&CK technique ID
  stage?: string; // Attack stage
  correlation_key?: string;
  related_event_ids?: string[];
  threat_score?: number;
}

export interface SecurityAlert {
  id: string;
  ruleName: string;
  ruleId: string;
  severity: Severity;
  timestamp: string;
  status: Status;
  classification: AlertClassification;
  mitreTechniques: string[];
  mitreTactics: string[];
  
  // Event context
  events: SIEMEvent[];
  hostname?: string;
  username?: string;
  srcIp?: string;
  dstIp?: string;
  process?: string;
  command?: string;
  fileHash?: string;
  domain?: string;
  
  // Threat intel
  threatIntelMatches?: ThreatIntelMatch[];
  
  // Case management
  caseId?: string;
  assignedTo?: string;
  comments?: AlertComment[];
  
  // Grading (for training)
  isTraining?: boolean;
  correctClassification?: AlertClassification;
  explanation?: string;
  keyIndicators?: string[];
  missedIndicators?: string[];
}

export interface ThreatIntelMatch {
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  source: string; // 'virustotal', 'abuseipdb', 'otx', 'misp', etc.
  reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  firstSeen?: string;
  lastSeen?: string;
  threatActor?: string;
  malwareFamily?: string;
  country?: string;
  asn?: string;
  description?: string;
}

export interface AlertComment {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface IncidentCase {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  severity: Severity;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  alerts: SecurityAlert[];
  timeline: TimelineEvent[];
  artifacts: {
    ips: string[];
    domains: string[];
    hashes: string[];
    users: string[];
    hosts: string[];
  };
  summary?: string;
  resolution?: string;
  mitreTechniques: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'alert' | 'log' | 'action' | 'comment';
  description: string;
  event?: SIEMEvent | SecurityAlert;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: Severity;
  query: string; // KQL/Lucene-like query
  mitreTechniques: string[];
  tags: string[];
  threshold?: number;
  timeWindow?: string;
}

// Classic game mode types removed - platform now uses SOC Simulation Mode only

export interface LogFilter {
  timeRange?: {
    start: Date;
    end: Date;
  };
  fields: Record<string, string>; // field -> value
  query: string;
}

