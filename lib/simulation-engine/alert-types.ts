// Alert System Types for Production-Realistic SOC Simulation

export interface Alert {
  id: string;
  ticket_number: string; // INC-2024-123456
  session_id: string;
  
  // Alert metadata
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  alert_source: 'EDR' | 'SIEM' | 'IDS' | 'IPS' | 'Firewall' | 'Email Gateway' | 'Cloud';
  detection_rule: string;
  
  // Affected assets
  affected_assets: Array<{
    hostname: string;
    ip: string;
    user?: string;
    asset_type?: string;
  }>;
  
  // Status
  status: 'New' | 'Investigating' | 'Escalated' | 'Closed' | 'False Positive';
  assigned_to: string;
  
  // SLA
  sla_deadline: Date;
  sla_remaining_seconds: number;
  sla_status: 'OnTime' | 'Warning' | 'Breached';
  
  // Priority
  priority_score: number; // 0-100
  containment_required: boolean;
  
  // Correlation
  related_alert_ids: string[];
  related_event_ids: string[];
  
  // Context
  initial_context: string;
  is_true_positive?: boolean; // Hidden from user, for grading
  
  // Timestamps
  created_at: Date;
  first_viewed_at?: Date;
  action_taken_at?: Date;
  closed_at?: Date;
  
  // Performance
  time_to_triage_seconds?: number;
  time_to_containment_seconds?: number;
  user_classification?: 'True Positive' | 'False Positive' | 'Benign' | 'Needs Escalation';
}

export interface ResponseAction {
  id: string;
  alert_id: string;
  action_type: 'isolate_host' | 'block_ip' | 'block_domain' | 'kill_process' | 
                'disable_account' | 'reset_password' | 'collect_memory' | 'snapshot_disk';
  target: string;
  parameters: Record<string, any>;
  
  // Timing
  executed_at: Date;
  effective_at?: Date;
  duration_seconds?: number;
  
  // Evaluation (hidden from user until report)
  was_appropriate: boolean;
  impact_score: number; // Business impact (negative if disruptive)
  effectiveness_score: number;
  
  // Results
  success: boolean;
  result_message: string;
  side_effects: Record<string, any>;
}

export interface OsintLookup {
  id: string;
  indicator_value: string;
  indicator_type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  tool_used: 'VirusTotal' | 'AbuseIPDB' | 'GreyNoise' | 'AlienVault' | 'Shodan' | 'PassiveDNS';
  
  // Resource tracking
  api_calls_used: number;
  cost_credits: number;
  
  // Results
  threat_score: number; // 0-100
  classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  raw_results: Record<string, any>;
  
  response_time_ms: number;
  was_helpful?: boolean;
  created_at: Date;
}

export const SLA_REQUIREMENTS = {
  Critical: { investigationTime: 15, containmentTime: 30 }, // minutes
  High: { investigationTime: 60, containmentTime: 120 },
  Medium: { investigationTime: 240, containmentTime: 480 },
  Low: { investigationTime: 1440, containmentTime: 2880 },
  Informational: { investigationTime: 4320, containmentTime: 8640 }
} as const;

