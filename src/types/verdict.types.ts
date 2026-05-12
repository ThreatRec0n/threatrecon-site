export type AccuseMotiveChoice =
  | 'FINANCIAL'
  | 'GRIEVANCE'
  | 'IDEOLOGY'
  | 'OPPORTUNITY';

export type AccuseRecommendation =
  | 'termination_legal'
  | 'termination'
  | 'suspension'
  | 'more_investigation';

export interface AccusationSubmission {
  suspectId: string;
  motive: AccuseMotiveChoice;
  incidentType: 'malicious' | 'negligent' | 'coerced';
  topEvidenceIds: [string, string, string];
  recommendation: AccuseRecommendation;
  summary: string;
}

export interface VerdictResult {
  correctSuspect: boolean;
  correctMotive: boolean;
  correctIncident: boolean;
  evidenceFoundRatio: number;
  evidenceScore: number;
  screenshotScore: number;
  timelineAccuracy: number;
  summaryQualityScore: number;
  totalScore: number;
  grade: string;
  missedEvidence: MissedEvidenceRow[];
  revealWrongSuspect?: { name: string; avatarId: string };
  actualPerpetrator?: { name: string; avatarId: string };
  missedCluesSummary?: string;
  allKeyEvidenceForActual?: MissedEvidenceRow[];
}

export interface MissedEvidenceRow {
  title: string;
  location: string;
  command?: string;
}
