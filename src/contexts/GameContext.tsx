import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import { getCaseContent } from '@/data/cases/registry';

type GameCtx = {
  caseId: string | null;
  difficulty: Difficulty | null;
  content: CaseContent | null;
  openCase: (caseId: string, difficulty: Difficulty) => void;
  exitCase: () => void;
};

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const content = useMemo(
    () => (caseId ? getCaseContent(caseId) ?? null : null),
    [caseId],
  );

  const openCase = useCallback((id: string, d: Difficulty) => {
    setCaseId(id);
    setDifficulty(d);
  }, []);

  const exitCase = useCallback(() => {
    setCaseId(null);
    setDifficulty(null);
  }, []);

  const value = useMemo(
    () => ({
      caseId,
      difficulty,
      content,
      openCase,
      exitCase,
    }),
    [caseId, difficulty, content, openCase, exitCase],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame requires GameProvider');
  return v;
}
