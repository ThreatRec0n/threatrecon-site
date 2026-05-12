import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { EvidenceCategory } from '@/types/evidence.types';
import type { ScreenshotEvidence } from '@/types/evidence.types';
import type { TimelineSlot } from '@/types/evidence.types';
import type { ConnectionBoardState } from '@/types/evidence.types';
import type { NotebookEvidenceEntry } from '@/types/evidence.types';
import type { CaseEvidenceItem } from '@/types/case.types';
import { loadCaseProgress, saveCaseProgress } from '@/utils/storage';

export type TaggedEvidence = {
  evidenceId: string;
  suspectId: string;
  notes?: string;
  discoveredAt: string;
};

type EvidenceCtx = {
  tagged: TaggedEvidence[];
  screenshots: ScreenshotEvidence[];
  notebookNotes: Record<string, string>;
  motiveNotes: Record<string, string>;
  timeline: TimelineSlot[];
  connectionBoard: ConnectionBoardState;
  evidenceCatalog: Map<string, CaseEvidenceItem>;
  tagEvidence: (evidenceId: string, suspectId: string, notes?: string) => void;
  untagEvidence: (evidenceId: string) => void;
  addScreenshot: (s: ScreenshotEvidence) => void;
  removeScreenshot: (id: string) => void;
  setNotebookNote: (employeeId: string, text: string) => void;
  setMotiveNote: (employeeId: string, text: string) => void;
  setTimeline: (t: TimelineSlot[]) => void;
  setConnectionBoard: (c: ConnectionBoardState) => void;
  loadForCase: (
    caseId: string,
    catalog: Map<string, CaseEvidenceItem>,
    initialElapsed?: number,
  ) => void;
  persist: (caseId: string, elapsedSeconds: number) => void;
  resetLocal: () => void;
};

const Ctx = createContext<EvidenceCtx | null>(null);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [tagged, setTagged] = useState<TaggedEvidence[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotEvidence[]>([]);
  const [notebookNotes, setNotebookNotes] = useState<Record<string, string>>(
    {},
  );
  const [motiveNotes, setMotiveNotes] = useState<Record<string, string>>({});
  const [timeline, setTimeline] = useState<TimelineSlot[]>([]);
  const [connectionBoard, setConnectionBoard] = useState<ConnectionBoardState>(
    { nodes: [], edges: [] },
  );
  const [evidenceCatalog, setEvidenceCatalog] = useState<
    Map<string, CaseEvidenceItem>
  >(new Map());

  const tagEvidence = useCallback(
    (evidenceId: string, suspectId: string, notes?: string) => {
      setTagged((prev) => {
        const filtered = prev.filter((t) => t.evidenceId !== evidenceId);
        return [
          ...filtered,
          {
            evidenceId,
            suspectId,
            notes,
            discoveredAt: new Date().toISOString(),
          },
        ];
      });
    },
    [],
  );

  const untagEvidence = useCallback((evidenceId: string) => {
    setTagged((prev) => prev.filter((t) => t.evidenceId !== evidenceId));
  }, []);

  const addScreenshot = useCallback((s: ScreenshotEvidence) => {
    setScreenshots((prev) => [...prev, s]);
  }, []);

  const removeScreenshot = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const setNotebookNote = useCallback((employeeId: string, text: string) => {
    setNotebookNotes((prev) => ({ ...prev, [employeeId]: text }));
  }, []);

  const setMotiveNote = useCallback((employeeId: string, text: string) => {
    setMotiveNotes((prev) => ({ ...prev, [employeeId]: text }));
  }, []);

  const loadForCase = useCallback(
    (caseId: string, catalog: Map<string, CaseEvidenceItem>) => {
      setEvidenceCatalog(catalog);
      const saved = loadCaseProgress(caseId);
      if (saved) {
        setTagged(
          (saved.taggedEvidence ?? []).map((t) => ({
            evidenceId: t.evidenceId,
            suspectId: t.suspectId,
            notes: t.notes,
            discoveredAt:
              'discoveredAt' in t && typeof t.discoveredAt === 'string'
                ? t.discoveredAt
                : new Date().toISOString(),
          })),
        );
        setScreenshots(saved.screenshots ?? []);
        setNotebookNotes(saved.notebookNotes ?? {});
        setMotiveNotes(saved.motiveNotes ?? {});
        setTimeline(saved.timeline ?? []);
        setConnectionBoard(
          saved.connectionBoard ?? { nodes: [], edges: [] },
        );
      } else {
        setTagged([]);
        setScreenshots([]);
        setNotebookNotes({});
        setMotiveNotes({});
        setTimeline([]);
        setConnectionBoard({ nodes: [], edges: [] });
      }
    },
    [],
  );

  const persist = useCallback(
    (caseId: string, elapsedSeconds: number) => {
      const prev = loadCaseProgress(caseId);
      saveCaseProgress({
        caseId,
        evidenceFound: tagged.map((t) => t.evidenceId),
        taggedEvidence: tagged,
        screenshots,
        notebookNotes,
        motiveNotes,
        timeline,
        connectionBoard,
        elapsedSeconds,
        lastSaved: new Date().toISOString(),
        ...(prev ? {} : {}),
      });
    },
    [
      tagged,
      screenshots,
      notebookNotes,
      motiveNotes,
      timeline,
      connectionBoard,
    ],
  );

  const resetLocal = useCallback(() => {
    setTagged([]);
    setScreenshots([]);
    setNotebookNotes({});
    setMotiveNotes({});
    setTimeline([]);
    setConnectionBoard({ nodes: [], edges: [] });
  }, []);

  const value = useMemo(
    () => ({
      tagged,
      screenshots,
      notebookNotes,
      motiveNotes,
      timeline,
      connectionBoard,
      evidenceCatalog,
      tagEvidence,
      untagEvidence,
      addScreenshot,
      removeScreenshot,
      setNotebookNote,
      setMotiveNote,
      setTimeline,
      setConnectionBoard,
      loadForCase,
      persist,
      resetLocal,
    }),
    [
      tagged,
      screenshots,
      notebookNotes,
      motiveNotes,
      timeline,
      connectionBoard,
      evidenceCatalog,
      tagEvidence,
      untagEvidence,
      addScreenshot,
      removeScreenshot,
      setNotebookNote,
      setMotiveNote,
      loadForCase,
      persist,
      resetLocal,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEvidence() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEvidence requires EvidenceProvider');
  return v;
}

export function taggedNotebookEntries(
  tagged: TaggedEvidence[],
  catalog: Map<string, CaseEvidenceItem>,
): NotebookEvidenceEntry[] {
  return tagged.map((t) => {
    const item = catalog.get(t.evidenceId);
    return {
      id: `nb-${t.evidenceId}`,
      evidenceId: t.evidenceId,
      typeBadge: (item?.category ?? 'FILE') as EvidenceCategory,
      description: item?.title ?? t.evidenceId,
      suspectId: t.suspectId,
      discoveredAt: t.discoveredAt,
      playerNotes: t.notes ?? '',
    };
  });
}
