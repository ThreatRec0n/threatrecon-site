// Core data types for ThreatRecon Drill Platform

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  allowRealNames: boolean;
  dataRetentionDays: number;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  integrations?: {
    slack?: SlackIntegration;
    email?: EmailIntegration;
    calendar?: CalendarIntegration;
  };
}

export interface SlackIntegration {
  webhookUrl: string;
  enabled: boolean;
}

export interface EmailIntegration {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  enabled: boolean;
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'ical';
  apiKey?: string;
  enabled: boolean;
}

// Scenario Types
export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'low' | 'medium' | 'high';
  duration_minutes: number;
  roles: string[];
  injects: Inject[];
  branching_rules: BranchingRule[];
  end_conditions: EndCondition[];
  metadata: ScenarioMetadata;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioMetadata {
  author: string;
  version: string;
  tags: string[];
  industry?: string;
  compliance_frameworks?: string[];
  mitre_attack_techniques?: string[];
  estimated_setup_time: number;
  facilitator_notes?: string;
  prerequisites?: string[];
}

export interface Inject {
  id: string;
  time_offset_minutes: number;
  type: 'text' | 'sim_log' | 'email' | 'siem' | 'file' | 'manual';
  target_roles: string[];
  content: string;
  severity: 'info' | 'warning' | 'critical';
  branching?: BranchingCondition[];
  required_actions?: RequiredAction[];
  scoring_impact?: ScoringImpact;
  metadata?: InjectMetadata;
}

export interface InjectMetadata {
  source?: string;
  timestamp?: string;
  file_name?: string;
  file_size?: number;
  hash?: string;
  ip_address?: string;
  user_agent?: string;
  headers?: Record<string, string>;
}

export interface BranchingRule {
  id: string;
  condition: string;
  true_goto: string;
  false_goto?: string;
  timeout_goto?: string;
  timeout_minutes?: number;
}

export interface BranchingCondition {
  if: string;
  goto: string;
  else?: string;
}

export interface EndCondition {
  type: 'time_elapsed' | 'all_injects_complete' | 'manual_end';
  minutes?: number;
  inject_ids?: string[];
}

export interface RequiredAction {
  role: string;
  action: string;
  timeout_minutes: number;
  penalty_points: number;
  bonus_points?: number;
}

export interface ScoringImpact {
  technical_response?: number;
  legal_compliance?: number;
  communication?: number;
  executive_decision?: number;
  business_continuity?: number;
}

// Session Types
export interface DrillSession {
  id: string;
  scenarioId: string;
  tenantId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt: Date;
  endedAt?: Date;
  participants: Participant[];
  events: SessionEvent[];
  scores: SessionScores;
  facilitator: FacilitatorInfo;
  settings: SessionSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  role: string;
  name?: string; // Only if allowRealNames is true
  joinedAt: Date;
  lastActivity: Date;
  decisions: Decision[];
}

export interface FacilitatorInfo {
  userId?: string;
  name: string;
  permissions: FacilitatorPermissions;
}

export interface FacilitatorPermissions {
  canPause: boolean;
  canInject: boolean;
  canEscalate: boolean;
  canEndSession: boolean;
  canViewAllDecisions: boolean;
}

export interface SessionSettings {
  difficulty: 'low' | 'medium' | 'high';
  noiseLevel: number; // 0-100, affects false positive injects
  timeAcceleration: number; // 1.0 = real time, 2.0 = 2x speed
  allowManualInjects: boolean;
  enableBranching: boolean;
  scoringEnabled: boolean;
  currentSeverity?: 'info' | 'warning' | 'critical';
}

export interface SessionEvent {
  id: string;
  type: 'inject' | 'decision' | 'pause' | 'resume' | 'escalation' | 'manual_note';
  timestamp: Date;
  role?: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface Decision {
  id: string;
  sessionId: string;
  role: string;
  action: string;
  parameters: Record<string, any>;
  rationale: string;
  timestamp: Date;
  evidence_refs?: string[];
  confidence?: number; // 1-10 scale
}

// Scoring Types
export interface SessionScores {
  technical_response: ScoreAxis;
  legal_compliance: ScoreAxis;
  communication: ScoreAxis;
  executive_decision: ScoreAxis;
  business_continuity: ScoreAxis;
  overall: number;
  calculatedAt: Date;
}

export interface ScoreAxis {
  score: number; // 0-100
  maxScore: number;
  penalties: ScorePenalty[];
  bonuses: ScoreBonus[];
  breakdown: ScoreBreakdown;
}

export interface ScorePenalty {
  reason: string;
  points: number;
  timestamp: Date;
  injectId?: string;
  decisionId?: string;
}

export interface ScoreBonus {
  reason: string;
  points: number;
  timestamp: Date;
  injectId?: string;
  decisionId?: string;
}

export interface ScoreBreakdown {
  timeToDetect?: number; // minutes
  timeToEscalate?: number; // minutes
  timeToContain?: number; // minutes
  requiredActionsCompleted: number;
  totalRequiredActions: number;
  evidencePreserved: boolean;
  legalNotified: boolean;
  communicationsSent: boolean;
  businessContinuityActivated: boolean;
}

// Export Types
export interface AARExport {
  id: string;
  sessionId: string;
  format: 'pdf' | 'json' | 'markdown';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  filePath?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AARContent {
  executive_summary: ExecutiveSummary;
  timeline: TimelineEvent[];
  decisions: DecisionSummary[];
  scores: SessionScores;
  gap_analysis: GapAnalysis[];
  remediation_tasks: RemediationTask[];
  recommendations: Recommendation[];
  artifacts: Artifact[];
  metadata: AARMetadata;
}

export interface ExecutiveSummary {
  incident_type: string;
  duration_minutes: number;
  participants_count: number;
  overall_score: number;
  key_findings: string[];
  critical_gaps: string[];
  next_steps: string[];
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'inject' | 'decision' | 'milestone';
  description: string;
  role?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface DecisionSummary {
  role: string;
  action: string;
  timestamp: Date;
  rationale: string;
  impact: 'positive' | 'negative' | 'neutral';
  score_impact: number;
}

export interface GapAnalysis {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
  priority: number;
}

export interface RemediationTask {
  id: string;
  title: string;
  description: string;
  assigned_role: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  dependencies?: string[];
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: number;
  implementation_effort: 'low' | 'medium' | 'high';
  business_impact: 'low' | 'medium' | 'high';
}

export interface Artifact {
  type: 'log' | 'screenshot' | 'file' | 'email' | 'siem_alert';
  name: string;
  description: string;
  timestamp: Date;
  source: string;
  hash?: string;
  size?: number;
}

export interface AARMetadata {
  generated_at: Date;
  generated_by: string;
  version: string;
  scenario_version: string;
  tenant_id: string;
  session_duration: number;
  total_decisions: number;
  total_injects: number;
  cryptographic_hash?: string;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'admin' | 'facilitator' | 'participant';
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserPermissions {
  canCreateScenarios: boolean;
  canRunSessions: boolean;
  canViewAllSessions: boolean;
  canExportAARs: boolean;
  canManageUsers: boolean;
  canAccessAdminPanel: boolean;
}

export interface AuthToken {
  token: string;
  userId: string;
  tenantId: string;
  expiresAt: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Audit Types
export interface AuditEvent {
  id: string;
  sessionId: string;
  type: 'facilitator_action' | 'participant_decision' | 'inject_delivery' | 'milestone';
  timestamp: Date;
  facilitatorRole?: string;
  participantRole?: string;
  actionType: string;
  metadata?: Record<string, any>;
}

export interface FacilitatorAction {
  sessionId: string;
  actionType: 'PAUSE' | 'RESUME' | 'MANUAL_INJECT' | 'ESCALATE' | 'END' | 'DELETE' | 'MILESTONE';
  facilitatorRole: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// WebSocket Event Types
export interface SocketEvents {
  'join-session': (sessionId: string, role: string) => void;
  'leave-session': (sessionId: string) => void;
  'decision': (data: { sessionId: string; role: string; decision: Decision }) => void;
  'inject-received': (inject: Inject) => void;
  'session-updated': (session: DrillSession) => void;
  'participant-joined': (data: { role: string; timestamp: string }) => void;
  'participant-left': (data: { role: string; timestamp: string }) => void;
  'session-paused': (data: { timestamp: string; reason?: string; facilitatorRole?: string }) => void;
  'session-resumed': (data: { timestamp: string; facilitatorRole?: string }) => void;
  'session-ended': (data: { timestamp: string; reason: string; facilitatorRole?: string; aarGenerating?: boolean }) => void;
  'severity-escalated': (data: { level: string; message: string; timestamp: string; facilitatorRole?: string }) => void;
  'manual-inject': (inject: Inject) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// Configuration Types
export interface AppConfig {
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    url: string;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  storage: {
    type: 'local' | 's3';
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  email: {
    provider: 'smtp' | 'ses' | 'sendgrid';
    from: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  logging: {
    level: string;
    file: boolean;
    console: boolean;
  };
}
