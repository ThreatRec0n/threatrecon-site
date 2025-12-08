export interface Alert {
  id: string;
  ticket_number: string;
  session_id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source: 'EDR' | 'SIEM' | 'Firewall' | 'IDS';
  detection_rule: string;
  affected_systems: Array<{
    hostname: string;
    ip: string;
    user?: string;
  }>;
  status: 'New' | 'Investigating' | 'Closed' | 'False Positive';
  assigned_to: string;
  sla_deadline: Date;
  sla_remaining_seconds: number;
  sla_status: 'Safe' | 'Warning' | 'Breached';
  priority_score: number;
  requires_containment: boolean;
  initial_description: string;
  related_event_ids: string[];
  is_true_threat: boolean;
  expected_classification: 'True Positive' | 'False Positive';
  created_at: Date;
  viewed_at?: Date;
  triaged_at?: Date;
}

export type LogSource = 'sysmon' | 'zeek' | 'suricata' | 'edr' | 'cloudtrail' | 'windows-event';

export type AttackStage = 
  | 'initial-access'
  | 'execution'
  | 'persistence'
  | 'privilege-escalation'
  | 'defense-evasion'
  | 'credential-access'
  | 'discovery'
  | 'lateral-movement'
  | 'collection'
  | 'command-and-control'
  | 'exfiltration'
  | 'impact';

export interface AttackChain {
  id: string;
  scenario_id: string;
  session_id: string;
  name: string;
  description: string;
  stages: AttackStage[];
  status: 'active' | 'completed' | 'detected' | 'failed';
  start_time: string;
  end_time?: string;
}

export interface GeneratedAlert {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  events: string[];
  technique_id: string;
  stage: AttackStage;
  context: Record<string, any>;
  threat_score: number;
}

export interface ProcessTreeNode {
  process_id: string;
  process_name: string;
  command_line: string;
  parent_id?: string;
  children: ProcessTreeNode[];
  timestamp: string;
  user: string;
  hostname: string;
}

export interface NetworkContext {
  source_ip: string;
  dest_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  bytes_sent: number;
  bytes_received: number;
  duration: number;
  related_connections: string[];
}

export interface AttackChainStage {
  stage: AttackStage;
  technique_id: string;
  technique_name: string;
  timestamp: string;
  success: boolean;
  events: string[];
  artifacts: AttackArtifact[];
  description: string;
}

export interface AttackArtifact {
  type: 'ip' | 'domain' | 'hash' | 'file' | 'process' | 'user' | 'registry_key';
  value: string;
  context: string;
  discovered_at: string;
}

export interface ScenarioStory {
  id: string;
  name: string;
  description: string;
  initial_infection_vector: 'phishing' | 'usb' | 'drive-by' | 'supply-chain' | 'credential-theft' | 'valid-accounts';
  attack_chains: string[];
  timeline: ScenarioTimelineEvent[];
  learning_objectives: string[];
  difficulty: 'grasshopper' | 'beginner' | 'intermediate' | 'advanced';
  narrative?: {
    background: string;
    incident: string;
    yourRole: string;
  };
}

export interface ScenarioTimelineEvent {
  timestamp: string;
  stage: AttackStage;
  description: string;
  visible_to_user: boolean;
  detection_triggered: boolean;
}

export interface DetectionRule {
  id: string;
  name: string;
  query: string;
  mitre_techniques: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  threshold?: number;
  time_window?: string;
}

export interface SimulatedEvent {
  id: string;
  session_id: string;
  scenario_id: string;
  source: LogSource;
  event_type: string;
  timestamp: string;
  hostname: string;
  username?: string;
  process_name?: string;
  command_line?: string;
  source_ip?: string;
  dest_ip?: string;
  dest_port?: number;
  protocol?: string;
  is_malicious: boolean;
  technique_id: string;
  stage: AttackStage;
  threat_score: number;
  raw_log: Record<string, any>;
  details: Record<string, any>;
  related_event_ids: string[];
  correlation_key?: string;
  network_context?: {
    source_ip: string;
    dest_ip: string;
    source_port: number;
    dest_port: number;
    protocol: string;
    bytes_sent: number;
    bytes_received: number;
    duration: number;
    related_connections: string[];
  };
}

export interface InvestigationSession {
  session_id: string;
  scenario_name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  alerts: Alert[];
  events: SimulatedEvent[];
  attack_chain: {
    stages: string[];
    techniques: string[];
  };
  alerts_triaged: number;
  correct_identifications: number;
  false_positives_flagged: number;
  missed_threats: number;
  started_at: Date;
  sla_breaches: number;
  average_triage_time: number;
  accuracy_percentage: number;
  speed_score: number;
  final_grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export const SLA_REQUIREMENTS = {
  Critical: { minutes: 15, description: '15 minutes to triage' },
  High: { minutes: 60, description: '1 hour to triage' },
  Medium: { minutes: 240, description: '4 hours to triage' },
  Low: { minutes: 1440, description: '24 hours to triage' }
} as const;
