// ============================================================================
// CORE SIMULATION TYPES - Single Source of Truth
// ============================================================================

export interface Alert {
  id: string;
  ticket_number: string;  // INC-2024-001234
  session_id: string;
  
  // Alert Identity
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source: 'EDR' | 'SIEM' | 'Firewall' | 'IDS';
  detection_rule: string;
  
  // Affected Systems
  affected_systems: Array<{
    hostname: string;
    ip: string;
    user?: string;
  }>;
  
  // Status & Workflow
  status: 'New' | 'Investigating' | 'Closed' | 'False Positive';
  assigned_to: 'Your Queue' | 'Tier 2' | 'Tier 3';
  
  // SLA Management (CRITICAL for realism)
  sla_deadline: Date;
  sla_remaining_seconds: number;
  sla_status: 'Safe' | 'Warning' | 'Breached';
  
  // Investigation Context
  priority_score: number;  // 0-100
  requires_containment: boolean;
  initial_description: string;
  related_event_ids: string[];
  
  // Grading (hidden from user)
  is_true_threat: boolean;
  expected_classification: 'True Positive' | 'False Positive';
  
  // Timestamps
  created_at: Date;
  viewed_at?: Date;
  triaged_at?: Date;
}

export interface SimulatedEvent {
  id: string;
  session_id: string;
  
  // Event Identity
  source: 'sysmon' | 'zeek' | 'windows' | 'firewall';
  event_type: string;
  timestamp: string;
  
  // System Context
  hostname: string;
  username?: string;
  process_name?: string;
  command_line?: string;
  
  // Network Context
  source_ip?: string;
  dest_ip?: string;
  dest_port?: number;
  protocol?: string;
  
  // Classification (for grading)
  is_malicious: boolean;
  technique_id?: string;  // MITRE ATT&CK
  stage?: string;         // Attack chain stage
  threat_score: number;   // 0-100
  
  // Raw log data
  raw_log: Record<string, any>;
}

export interface InvestigationSession {
  session_id: string;
  scenario_name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Content
  alerts: Alert[];
  events: SimulatedEvent[];
  attack_chain: {
    stages: string[];
    techniques: string[];
  };
  
  // Progress
  alerts_triaged: number;
  correct_identifications: number;
  false_positives_flagged: number;
  missed_threats: number;
  
  // Timing
  started_at: Date;
  sla_breaches: number;
  average_triage_time: number;
  
  // Final Score
  accuracy_percentage: number;
  speed_score: number;
  final_grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// SLA Requirements (industry standard)
export const SLA_REQUIREMENTS = {
  Critical: { minutes: 15, description: '15 minutes to triage' },
  High: { minutes: 60, description: '1 hour to triage' },
  Medium: { minutes: 240, description: '4 hours to triage' },
  Low: { minutes: 1440, description: '24 hours to triage' }
} as const;

