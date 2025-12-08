// Comprehensive TypeScript Types for SOC Investigation System

// Import types for use in this file
import type {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertStatus,
  SLATimer,
  SLATimerStatus,
  AlertNote,
  ThreatIntelMatch,
} from './soc-alert-types';

// Re-export core types
export type {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertStatus,
  SLATimer,
  SLATimerStatus,
  AlertNote,
  ThreatIntelMatch,
} from './soc-alert-types';

import type {
  IOC,
  IOCType,
  IOCTag,
  IOCSource,
  IOCNote,
  IOCEnrichmentResult,
} from './ioc-tracking';

import type {
  LogSourceType,
  LogSource,
} from './multi-source-log-generator';

// Investigation State Types
export interface InvestigationState {
  sessionId: string;
  scenarioId: string;
  startTime: Date;
  currentPhase: InvestigationPhase;
  
  // Alerts
  alerts: Alert[];
  selectedAlert: string | null; // Alert ID
  
  // Events
  events: any[]; // SimulatedEvent[]
  eventsViewed: Set<string>; // Event IDs
  eventsFiltered: any[]; // Filtered events
  
  // IOCs
  iocs: Map<string, IOC>; // IOC ID -> IOC
  iocTags: Record<string, IOCTag>; // IOC value -> tag
  
  // Investigation
  queriesExecuted: Query[];
  notesRecorded: InvestigationNote[];
  evidenceCollected: Evidence[];
  
  // Time tracking
  timeLapsed: number; // minutes
  slaStatus: Map<string, SLATimerStatus>; // Alert ID -> SLA status
  
  // Performance metrics
  metrics: InvestigationMetrics;
}

export type InvestigationPhase = 
  | 'initialization'
  | 'triage'
  | 'investigation'
  | 'containment'
  | 'eradication'
  | 'recovery'
  | 'documentation'
  | 'completed';

export interface InvestigationNote {
  id: string;
  timestamp: Date;
  author: string;
  content: string;
  type: 'observation' | 'hypothesis' | 'finding' | 'action' | 'question';
  linkedAlerts?: string[];
  linkedIOCs?: string[];
  linkedEvents?: string[];
  tags?: string[];
}

export interface Evidence {
  id: string;
  type: 'log' | 'alert' | 'ioc' | 'screenshot' | 'memory-dump' | 'network-capture' | 'file';
  source: string;
  timestamp: Date;
  collectedBy: string;
  hash?: string; // SHA256 for integrity
  storageLocation?: string;
  description: string;
  linkedTo: string[]; // Related evidence IDs
  legalHold: boolean;
}

export interface Query {
  id: string;
  query: string;
  syntax: 'SPL' | 'KQL' | 'ELK';
  timestamp: Date;
  executedBy: string;
  results?: QueryResult;
  saved: boolean;
}

export interface QueryResult {
  eventCount: number;
  events: any[];
  executionTime: number; // milliseconds
  fieldsScanned: string[];
  error?: string;
}

export interface InvestigationMetrics {
  // Speed metrics
  averageTriageTime: number; // seconds
  timeToContainment: number; // minutes
  slaComplianceRate: number; // percentage
  
  // Accuracy metrics
  truePositiveRate: number; // percentage
  falsePositiveRate: number; // percentage
  missedDetections: number;
  
  // Investigation quality
  iocAccuracy: number; // percentage
  mitreAccuracy: number; // percentage
  reportCompleteness: number; // percentage
  
  // Operational efficiency
  queryEfficiency: number; // effective queries vs total
  osintEfficiency: number; // valuable lookups vs wasted
  escalationJudgment: number; // appropriate escalations
  
  // Business impact
  containmentScore: number; // balanced security vs business
  downtimeMinimization: number;
  costEffectiveness: number;
}

// Log Source Configuration
export interface LogSourceConfig {
  name: string;
  type: LogSourceType;
  enabled: boolean;
  availability: number; // 0-100%
  latency: number; // minutes
  retention: number; // days
  eventTypes: string[];
  filters?: LogSourceFilter[];
}

export interface LogSourceFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
}

// Alert Correlation
export interface AlertCorrelation {
  alertIds: string[];
  correlationType: 'same-host' | 'same-user' | 'same-ip' | 'same-domain' | 'temporal' | 'mitre-chain';
  confidence: number; // 0-100
  description: string;
}

// Incident Case (extends from soc-workflows but enhanced)
export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  severity: AlertSeverity;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  createdBy: string;
  
  // Attack chain
  mitreTechniques: string[];
  mitreTactics: string[];
  attackStage: string;
  
  // Linked items
  linkedAlerts: string[];
  linkedIOCs: string[];
  linkedEvents: string[];
  
  // Investigation findings
  keyFindings: string[];
  timeline: TimelineEvent[];
  rootCause?: string;
  scope?: string; // How many systems affected
  
  // Response
  containmentActions: ResponseAction[];
  eradicationActions: ResponseAction[];
  recoveryActions: ResponseAction[];
  
  // Documentation
  notes: InvestigationNote[];
  evidence: Evidence[];
  report?: IncidentReport;
  
  // Metrics
  metrics: {
    dwellTime: number; // Minutes from compromise to detection
    responseTime: number; // Detection to containment
    businessDowntime: number; // Minutes of service disruption
    dataExposed: boolean;
    dataExfiltrated: boolean;
    estimatedCost: number;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'alert' | 'log' | 'action' | 'comment' | 'ioc' | 'containment';
  description: string;
  source: string;
  event?: any;
  alert?: Alert;
  ioc?: IOC;
  action?: ResponseAction;
}

export interface ResponseAction {
  id: string;
  type: 'isolate-host' | 'block-ip' | 'block-domain' | 'kill-process' | 'disable-account' | 'reset-password' | 'collect-memory' | 'snapshot-disk';
  target: string; // Hostname, IP, domain, PID, username, etc.
  executedAt: Date;
  executedBy: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  impact?: string; // Business impact description
  reversible: boolean;
  approvalRequired: boolean;
  approvedBy?: string;
}

export interface IncidentReport {
  // Executive Summary
  summary: {
    incidentType: string;
    severity: AlertSeverity;
    affectedSystems: string[];
    businessImpact: string;
    currentStatus: string;
  };
  
  // Timeline
  timeline: {
    detectionTime: Date;
    initialResponseTime: Date;
    containmentTime: Date;
    eradicationTime: Date;
    recoveryTime: Date;
    events: TimelineEvent[];
  };
  
  // Technical Analysis
  analysis: {
    attackVector: string;
    attackChain: string[]; // MITRE technique IDs
    indicators: {
      ips: string[];
      domains: string[];
      hashes: string[];
      filePaths: string[];
      registryKeys: string[];
      processes: string[];
    };
    rootCause: string;
    scope: string;
  };
  
  // Evidence
  evidence: Evidence[];
  
  // Actions Taken
  response: {
    containment: ResponseAction[];
    eradication: ResponseAction[];
    recovery: ResponseAction[];
  };
  
  // Recommendations
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    detectionRules: string[];
  };
  
  // Metrics
  metrics: {
    dwellTime: number;
    responseTime: number;
    businessDowntime: number;
    dataExposed: boolean;
    dataExfiltrated: boolean;
    estimatedCost: number;
  };
}

// Session State
export interface SessionState {
  sessionId: string;
  userId: string;
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  investigationState: InvestigationState;
  score?: number;
  completedAt?: Date;
}

// Filter and Search Types
export interface EventFilter {
  timeRange?: {
    start: Date;
    end: Date;
  };
  sources?: LogSourceType[];
  severities?: AlertSeverity[];
  stages?: string[];
  mitreTechniques?: string[];
  hosts?: string[];
  users?: string[];
  query?: string; // Free text search
}

export interface AlertFilter {
  status?: AlertStatus[];
  severity?: AlertSeverity[];
  source?: AlertSource[];
  assignedTo?: string[];
  slaStatus?: SLATimerStatus[];
  containmentRequired?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Export all types for easy importing
export type {
  SimulatedEvent,
  AttackStage,
  ProcessTreeNode,
  NetworkContext,
  AttackChain,
  AttackChainStage,
  AttackArtifact,
  ScenarioStory,
  ScenarioTimelineEvent,
  DetectionRule,
  GeneratedAlert,
} from './simulation-engine/core-types';

export type {
  AlertQueueItem,
  EvidenceItem,
  CaseArtifact,
  SOCRole,
  CaseStatus,
} from './soc-workflows';

// Re-export all imported types for external consumers
export type {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertStatus,
  SLATimer,
  SLATimerStatus,
  AlertNote,
  ThreatIntelMatch,
} from './soc-alert-types';

export type {
  IOC,
  IOCType,
  IOCTag,
  IOCSource,
  IOCNote,
  IOCEnrichmentResult,
} from './ioc-tracking';

export type {
  LogSourceType,
  LogSource,
} from './multi-source-log-generator';

