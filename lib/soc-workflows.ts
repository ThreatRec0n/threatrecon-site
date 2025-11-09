// SOC workflow definitions and state management

export type SOCRole = 'tier1' | 'tier2' | 'detection-engineer' | 'threat-hunter' | 'incident-responder';

export type AlertStatus = 'new' | 'triaged' | 'investigating' | 'escalated' | 'resolved' | 'false-positive';

export type CaseStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export interface AlertQueueItem {
  id: string;
  alertId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: AlertStatus;
  assignedTo?: string;
  triagedAt?: string;
  triagedBy?: string;
  notes: string[];
  linkedCaseId?: string;
}

export interface EvidenceItem {
  id: string;
  type: 'log' | 'alert' | 'ip' | 'domain' | 'hash' | 'file' | 'process' | 'user';
  value: string;
  source: string;
  timestamp: string;
  notes: string;
  tags: string[];
  bookmarked: boolean;
  pinned: boolean;
  linkedTo: string[]; // IDs of related evidence
}

export interface InvestigationNote {
  id: string;
  timestamp: string;
  content: string;
  author: string;
  tags: string[];
  linkedEvidence: string[];
}

export interface CaseArtifact {
  type: 'ip' | 'domain' | 'hash' | 'file' | 'process' | 'user' | 'registry';
  value: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
  context: string;
  threatIntel?: {
    reputation: string;
    sources: string[];
    lastUpdated: string;
  };
}

export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  createdBy: string;
  
  // Attack chain
  mitreTechniques: string[];
  attackStage: 'initial-access' | 'execution' | 'persistence' | 'privilege-escalation' | 'defense-evasion' | 'credential-access' | 'discovery' | 'lateral-movement' | 'collection' | 'exfiltration' | 'command-and-control' | 'impact';
  
  // Evidence and artifacts
  artifacts: CaseArtifact[];
  evidence: EvidenceItem[];
  notes: InvestigationNote[];
  
  // Linked items
  linkedAlerts: string[];
  linkedLogs: string[];
  
  // Investigation findings
  keyFindings: string[];
  timeline: Array<{
    timestamp: string;
    event: string;
    source: string;
  }>;
  
  // Response
  containmentActions: string[];
  eradicationActions: string[];
  recoveryActions: string[];
  lessonsLearned: string[];
  
  // Detection
  detectionRules: string[]; // Rule IDs
  recommendedRules: string[];
}

export interface SOCWorkflowState {
  currentRole: SOCRole;
  alertQueue: AlertQueueItem[];
  activeCases: IncidentCase[];
  evidenceWorkspace: EvidenceItem[];
  investigationNotes: InvestigationNote[];
}

export function createAlertQueueItem(alertId: string, priority: 'critical' | 'high' | 'medium' | 'low'): AlertQueueItem {
  return {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    alertId,
    priority,
    status: 'new',
    notes: [],
  };
}

export function createEvidenceItem(
  type: EvidenceItem['type'],
  value: string,
  source: string
): EvidenceItem {
  return {
    id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    value,
    source,
    timestamp: new Date().toISOString(),
    notes: '',
    tags: [],
    bookmarked: false,
    pinned: false,
    linkedTo: [],
  };
}

export function createInvestigationNote(content: string, author: string = 'analyst'): InvestigationNote {
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    content,
    author,
    tags: [],
    linkedEvidence: [],
  };
}

export function createIncidentCase(
  title: string,
  description: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  createdBy: string = 'analyst'
): IncidentCase {
  return {
    id: `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    status: 'open',
    severity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    mitreTechniques: [],
    attackStage: 'initial-access',
    artifacts: [],
    evidence: [],
    notes: [],
    linkedAlerts: [],
    linkedLogs: [],
    keyFindings: [],
    timeline: [],
    containmentActions: [],
    eradicationActions: [],
    recoveryActions: [],
    lessonsLearned: [],
    detectionRules: [],
    recommendedRules: [],
  };
}

