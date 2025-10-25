// Simple types for testing
export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'low' | 'medium' | 'high';
  duration_minutes: number;
  roles: string[];
  injects: Inject[];
  branching_rules: any[];
  end_conditions: any[];
  metadata: any;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Inject {
  id: string;
  time_offset_minutes: number;
  type: 'email' | 'text' | 'sim_log' | 'siem' | 'file' | 'manual';
  target_roles: string[];
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  branching?: any[];
  metadata?: any;
}

export interface DrillSession {
  id: string;
  scenarioId: string;
  status: string;
  startedAt?: Date;
  endedAt?: Date;
  participants: any[];
  scores: any;
  settings: any;
  tenantId: string;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: string;
  timestamp: Date;
  data: any;
}

export interface AuditEvent {
  id: string;
  sessionId: string;
  actionType: string;
  facilitatorRole: string;
  timestamp: Date;
  metadata: any;
}

export interface FacilitatorAction {
  sessionId: string;
  actionType: string;
  facilitatorRole: string;
  timestamp: Date;
  metadata: any;
}
