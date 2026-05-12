import type { MotiveCategory } from './employee.types';
import type { EvidenceCategory, EvidenceSourceId } from './evidence.types';

export type CaseTypeBadge = 'DATA THEFT' | 'IP LEAK' | 'SABOTAGE' | 'FRAUD';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'HARD';

export interface CaseBriefing {
  incidentSummary: string;
  stolenOrDamaged: string;
  discoveryTimeline: string;
  taskStatement: string;
  letterheadCompany: string;
  letterDate: string;
  classificationStamp?: string;
}

export interface CaseDefinition {
  id: string;
  numberLabel: string;
  companyName: string;
  caseType: CaseTypeBadge;
  tagline: string;
  descriptionOneLine: string;
  difficultyEstimateMinutes: Record<Difficulty, number>;
  guiltyEmployeeId: string;
  correctMotive: MotiveCategory;
  correctIncidentType: 'malicious' | 'negligent' | 'coerced';
  secondaryActorIds?: string[];
  briefing: CaseBriefing;
  employeeIds: string[];
  scoringEvidenceIds: string[];
  debrief: CaseDebriefContent;
  beginnerHints?: Record<string, string>;
}

export interface CaseDebriefContent {
  fullStory: string;
  techniques: DebriefTechnique[];
  keyTakeaways: string[];
  behavioralIndicators: string[];
  whatToDoDifferentlyGeneric: string;
}

export interface DebriefTechnique {
  title: string;
  whatTheyDid: string;
  howItWorks: string;
  artifacts: string;
  howInvestigatorsFind: string;
  exampleCommands: string[];
  realTools: string;
}

export interface CaseEvidenceItem {
  id: string;
  source: EvidenceSourceId;
  category: EvidenceCategory;
  title: string;
  description: string;
  locationHint: string;
  commandHint?: string;
  isKey?: boolean;
}
