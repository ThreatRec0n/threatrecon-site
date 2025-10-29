import { makeSeed } from './random-net';
import { SCENARIOS } from './scenario-catalog';

export async function createRound({ scenarioId = 'mixed', difficulty = 'beginner', packetCountRange = [25,50] }) {
  const { seed } = makeSeed();
  const count = Math.floor((packetCountRange[0] + packetCountRange[1]) / 2);
  const scen = SCENARIOS[scenarioId] || SCENARIOS.mixed;
  const { packets, groundTruth, hints } = scen.generate({ difficulty, count });
  try {
    localStorage.setItem('tr_round_meta', JSON.stringify({ scenarioId, seed, startedAt: Date.now(), difficulty, count }));
  } catch {}
  return { packets, groundTruth, hints };
}

export function validateSubmission(selectedIds, groundTruth, { difficulty='beginner', hintsUsed=0 } = {}) {
  const setSel = new Set(selectedIds);
  const setTruth = new Set(groundTruth.ids);
  let correct = selectedIds.length === groundTruth.ids.length && groundTruth.ids.every(id => setSel.has(id));

  const base = difficulty === 'advanced' ? 200 : difficulty === 'intermediate' ? 150 : 100;
  const extraWrong = Math.max(0, selectedIds.length - groundTruth.ids.length);
  let scoreDelta = correct ? base : 0;
  scoreDelta -= hintsUsed * 10;
  scoreDelta -= extraWrong * 10;
  if (!correct && scoreDelta < 0) scoreDelta = 0; // floor 0 per spec

  const feedback = correct
    ? 'Your selection matches the evidence for this scenario.'
    : 'Your selection does not match the ground truth. Consider directionality, protocol semantics, and content that proves misuse.';

  return { correct, scoreDelta, feedback, rubric: groundTruth.rubric };
}


