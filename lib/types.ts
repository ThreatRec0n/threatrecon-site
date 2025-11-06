// Core types for the threat hunting platform

export type DifficultyLevel = 'guided' | 'beginner' | 'intermediate' | 'advanced';

export type ScenarioType = 
  | 'malware-infection'
  | 'insider-threat'
  | 'data-exfiltration'
  | 'lateral-movement'
  | 'web-compromise'
  | 'phishing'
  | 'ransomware'
  | 'command-control';

export interface Scenario {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  type: ScenarioType;
  order: number; // For linear progression
  
  // Narrative
  narrative: {
    background: string; // Realistic job scenario description
    incident: string; // What happened
    yourRole: string; // User's role in the scenario
    timeline: string; // When this occurred
  };
  
  // Log data
  logFiles: string[]; // Paths to log files in public/
  logTypes: string[]; // e.g., ['zeek', 'suricata', 'windows-event']
  
  // Questions
  questions: Question[];
  
  // Hints (optional, shown on request)
  hints?: string[];
  
  // Solution (shown after completion)
  solution: {
    summary: string;
    keyFindings: string[];
    mitreTechniques: string[]; // MITRE ATT&CK technique IDs
    recommendations: string[];
  };
  
  // Metadata
  estimatedTime: number; // minutes
  tags: string[];
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

