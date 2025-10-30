import { useMemo, useState, useEffect } from 'react';

export function pickPacketTargetCount(difficulty) {
  if (!difficulty) return 25;
  const d = String(difficulty).toLowerCase();
  if (d === 'advanced') return 100;
  if (d === 'intermediate') return 50;
  return 25;
}

export function useRoundBudget(difficulty) {
  const [budget, setBudget] = useState(() => pickPacketTargetCount(difficulty));
  useEffect(() => {
    setBudget(pickPacketTargetCount(difficulty));
  }, [difficulty]);
  return useMemo(() => ({ budget, setBudget }), [budget]);
}

export function useEvidenceCount(markedIds) {
  const count = Array.isArray(markedIds) ? markedIds.length : (markedIds instanceof Set ? markedIds.size : 0);
  return count;
}


