import { safeDate } from './safe-time';

export function packetBudgetForDifficulty(diff) {
  if (diff === 'Advanced') return { total: 100, evMin: 3, evMax: 7 };
  if (diff === 'Intermediate') return { total: 50, evMin: 2, evMax: 4 };
  return { total: 25, evMin: 1, evMax: 2 };
}

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function scenarioPoolForProfile(profile) {
  if (profile && profile !== 'Mixed') return [profile];
  return [
    'http-exfil',
    'dns-tunnel',
    'smb-lateral',
    'tls-sni-suspect',
    'imap-leak',
    'ftp-clear',
    'ssh-bruteforce',
    'sip-rtp-voice',
    'icmp-c2',
    'arp-poison'
  ];
}

export async function newRound({ difficulty, profile, buildScenario }) {
  const { total, evMin, evMax } = packetBudgetForDifficulty(difficulty);
  const scenarios = scenarioPoolForProfile(profile);
  const chosen = pick(scenarios);
  const evCount = randInt(evMin, evMax);
  const { packets, evidenceIds, briefing } = await buildScenario({
    template: chosen,
    totalPackets: total,
    evidencePackets: evCount
  });

  const normalized = (packets || []).map((p, i) => ({
    ...p,
    ts: safeDate(p.ts || Date.now() + i * 5).getTime()
  }));

  return { packets: normalized, evidenceIds: evidenceIds || [], briefing, difficulty };
}

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


