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

export interface SimulatedEvent {
  id: string;
  session_id: string;
  scenario_id: string;
  source: 'sysmon' | 'zeek' | 'windows' | 'firewall';
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
  technique_id?: string;
  stage?: string;
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
