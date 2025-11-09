// Core types for the threat hunting platform

export type DifficultyLevel = 'guided' | 'beginner' | 'intermediate' | 'advanced';

export type AlertClassification = 'true-positive' | 'false-positive' | 'true-negative' | 'false-negative' | 'unclassified';

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

export interface Scenario {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  type: ScenarioType;
  order: number;
  
  narrative: {
    background: string;
    incident: string;
    yourRole: string;
    timeline: string;
  };
  
  // Randomized data
  seed?: number; // For randomization
  randomizedIps?: {
    malicious: string[];
    benign: string[];
  };
  randomizedDomains?: {
    malicious: string[];
    benign: string[];
  };
  randomizedHashes?: {
    malicious: string[];
    benign: string[];
  };
  
  // Alerts in this scenario (mix of true positives and false positives)
  alerts: SecurityAlert[];
  
  // Log data
  logFiles: string[];
  logTypes: string[];
  
  questions: Question[];
  hints?: string[];
  
  solution: {
    summary: string;
    keyFindings: string[];
    mitreTechniques: string[];
    recommendations: string[];
    truePositives: string[]; // Alert IDs
    falsePositives: string[]; // Alert IDs
  };
  
  estimatedTime: number;
  tags: string[];
  
  // Grading configuration
  showFeedback: boolean; // Only true for beginner/guided
  gradingCriteria: {
    classificationWeight: number;
    investigationWeight: number;
    timeWeight: number;
  };
}

export interface InvestigationResult {
  scenarioId: string;
  alertClassifications: Record<string, AlertClassification>;
  answers: Record<string, string>;
  timeSpent: number; // seconds
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    classifications: {
      correct: number;
      incorrect: number;
      missed: number; // False negatives
      falseAlarms: number; // False positives marked as true positives
    };
    questions: Array<{
      questionId: string;
      score: number;
      maxScore: number;
      correct: boolean;
    }>;
  };
  feedback?: {
    missedThreats: Array<{
      alertId: string;
      alertName: string;
      indicators: string[];
      explanation: string;
    }>;
    falseAlarms: Array<{
      alertId: string;
      alertName: string;
      whyFalsePositive: string;
      indicators: string[];
    }>;
    correctClassifications: Array<{
      alertId: string;
      alertName: string;
      whyCorrect: string;
    }>;
  };
}

export interface Question {
  id: string;
  prompt: string;
  type: 'text' | 'ip' | 'domain' | 'hash' | 'command';
  correctAnswers: string[]; // Multiple acceptable answers for keyword matching
  points: number;
  hint?: string;
  explanation?: string; // Shown after answering
}

export interface UserProgress {
  completedScenarios: string[];
  scores: Record<string, number>; // scenarioId -> score
  timeSpent: Record<string, number>; // scenarioId -> seconds
  achievements: string[];
  currentScenario?: string;
  startTime?: number;
}

export interface LogFilter {
  timeRange?: {
    start: Date;
    end: Date;
  };
  fields: Record<string, string>; // field -> value
  query: string;
}

