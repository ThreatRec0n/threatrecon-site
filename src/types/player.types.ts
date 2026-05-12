export interface PlayerProfile {
  name: string;
  badge: string;
  agency: string;
  casesCompleted: string[];
  caseHistory: PlayerCaseHistoryEntry[];
  createdAt: string;
}

export interface PlayerCaseHistoryEntry {
  caseId: string;
  score: number;
  grade: string;
  time: string;
  correct: boolean;
  accusedName: string;
  date: string;
}
