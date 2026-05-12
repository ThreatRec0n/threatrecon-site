export type EvidenceCategory =
  | 'FILE'
  | 'EMAIL'
  | 'NETWORK'
  | 'ACCESS'
  | 'USB'
  | 'BADGE'
  | 'MESSAGE'
  | 'CALENDAR'
  | 'PRINTER'
  | 'PHYSICAL'
  | 'COMMUNICATION';

export type EvidenceSourceId =
  | 'workstation'
  | 'email'
  | 'network'
  | 'access'
  | 'usb'
  | 'browser'
  | 'badge'
  | 'messages'
  | 'printer'
  | 'calendar'
  | 'recovery';

export interface ScreenshotEvidence {
  id: string;
  dataUrl: string;
  label: string;
  suspectId: string;
  category: EvidenceUIPanelCategory;
  notes: string;
  capturedAt: string;
}

export type EvidenceUIPanelCategory =
  | 'File Evidence'
  | 'Network Evidence'
  | 'Communication Evidence'
  | 'Access Evidence'
  | 'Physical Evidence';

export interface NotebookEvidenceEntry {
  id: string;
  evidenceId: string;
  typeBadge: EvidenceCategory;
  description: string;
  suspectId: string;
  discoveredAt: string;
  playerNotes: string;
}

export interface TimelineSlot {
  id: string;
  /** Stable — same as tagged evidence id */
  evidenceId: string;
}

export interface ConnectionEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface ConnectionBoardState {
  nodes: { id: string; label: string; type: 'employee' | 'evidence' }[];
  edges: ConnectionEdge[];
}
