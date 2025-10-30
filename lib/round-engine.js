import { makeSeed } from './random-net';
import { SCENARIOS, pickPacketCount, pickEvidenceCount } from './scenario-catalog';

export async function createRound({ scenarioId = 'mixed', difficulty = 'beginner' }) {
  const { seed } = makeSeed();
  const packetCount = pickPacketCount(difficulty);
  const evidenceCount = pickEvidenceCount(difficulty);
  const scen = SCENARIOS[scenarioId] || SCENARIOS.mixed;
  const { packets, groundTruth, hints } = scen.generate({ 
    difficulty, 
    packetCount, 
    evidenceCount, 
    seed 
  });
  try {
    localStorage.setItem('tr_round_meta', JSON.stringify({ 
      scenarioId, 
      seed, 
      startedAt: Date.now(), 
      difficulty, 
      packetCount,
      evidenceCount 
    }));
  } catch {}
  return { packets, groundTruth, hints };
}

export function validateSubmission(selectedIds, groundTruth, { difficulty='beginner', hintsUsed=0 } = {}) {
  const setSel = new Set(selectedIds);
  const setTruth = new Set(groundTruth.ids);
  
  // Calculate correct matches
  let correct = 0;
  setTruth.forEach(id => { 
    if (setSel.has(id)) correct++; 
  });
  
  const missed = setTruth.size - correct;
  const falsePositives = [...setSel].filter(id => !setTruth.has(id)).length;
  
  // Determine if submission is fully correct
  const isFullyCorrect = missed === 0 && falsePositives === 0;

  // Base scoring per difficulty
  const baseScores = { beginner: 100, intermediate: 200, advanced: 400 };
  const base = baseScores[difficulty] || 100;
  
  // Calculate score with penalties
  let scoreDelta = base;
  scoreDelta -= missed * 20;           // -20 per missed evidence packet
  scoreDelta -= falsePositives * 10;   // -10 per false positive
  scoreDelta -= hintsUsed * 10;        // -10 per hint used
  
  // Floor at 0 for incorrect submissions
  if (!isFullyCorrect) {
    scoreDelta = Math.max(0, scoreDelta);
  }

  // Generate feedback based on performance
  let feedback = '';
  if (isFullyCorrect) {
    feedback = 'Perfect! You correctly identified all evidence packets.';
  } else if (correct > 0) {
    feedback = `Partial success! You found ${correct} of ${setTruth.size} evidence packets. ${missed > 0 ? `Missed ${missed} evidence packets. ` : ''}${falsePositives > 0 ? `Incorrectly marked ${falsePositives} non-evidence packets.` : ''}`;
  } else {
    feedback = 'No evidence packets correctly identified. Review the protocol layers and content to identify suspicious patterns.';
  }

  return { 
    correct: isFullyCorrect, 
    scoreDelta, 
    feedback, 
    rubric: groundTruth.rubric,
    stats: {
      correct,
      missed,
      falsePositives,
      totalEvidence: setTruth.size,
      hintsUsed
    }
  };
}


