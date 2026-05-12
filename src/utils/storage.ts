import type { PlayerProfile } from '@/types/player.types';
import type { ScreenshotEvidence } from '@/types/evidence.types';
import type { TimelineSlot } from '@/types/evidence.types';
import type { ConnectionBoardState } from '@/types/evidence.types';

const PLAYER_KEY = 'threatrecon_insidejob_player';

export interface CaseProgress {
  caseId: string;
  evidenceFound: string[];
  taggedEvidence: {
    evidenceId: string;
    suspectId: string;
    notes?: string;
    discoveredAt?: string;
  }[];
  screenshots: ScreenshotEvidence[];
  notebookNotes: Record<string, string>;
  motiveNotes: Record<string, string>;
  timeline: TimelineSlot[];
  connectionBoard: ConnectionBoardState;
  elapsedSeconds: number;
  lastSaved: string;
}

function progressKey(caseId: string) {
  return `threatrecon_insidejob_progress_${caseId}`;
}

export function loadPlayer(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function savePlayer(profile: PlayerProfile) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(profile));
}

export function loadCaseProgress(caseId: string): CaseProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(caseId));
    if (!raw) return null;
    return JSON.parse(raw) as CaseProgress;
  } catch {
    return null;
  }
}

export function saveCaseProgress(progress: CaseProgress) {
  progress.lastSaved = new Date().toISOString();
  localStorage.setItem(progressKey(progress.caseId), JSON.stringify(progress));
}

export function clearCaseProgress(caseId: string) {
  localStorage.removeItem(progressKey(caseId));
}
