import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PlayerProfile } from '@/types/player.types';
import { loadPlayer, savePlayer } from '@/utils/storage';

type PlayerCtx = {
  profile: PlayerProfile | null;
  setProfile: (p: PlayerProfile) => void;
  updateProfile: (fn: (p: PlayerProfile) => PlayerProfile) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

function defaultProfile(): PlayerProfile {
  return {
    name: '',
    badge: '',
    agency: '',
    casesCompleted: [],
    caseHistory: [],
    createdAt: new Date().toISOString(),
  };
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<PlayerProfile | null>(() => {
    return loadPlayer();
  });

  const setProfile = useCallback((p: PlayerProfile) => {
    savePlayer(p);
    setProfileState(p);
  }, []);

  const updateProfile = useCallback((fn: (p: PlayerProfile) => PlayerProfile) => {
    setProfileState((prev) => {
      const base = prev ?? defaultProfile();
      const next = fn(base);
      savePlayer(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, updateProfile }),
    [profile, setProfile, updateProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlayer requires PlayerProvider');
  return v;
}
