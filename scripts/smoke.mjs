import { packetBudgetForDifficulty, newRound } from '../lib/round-engine.js';

function assert(cond, msg){ if(!cond){ console.error('SMOKE FAIL:', msg); process.exit(1);} }

// Budget checks
const b = packetBudgetForDifficulty('Beginner');
const i = packetBudgetForDifficulty('Intermediate');
const a = packetBudgetForDifficulty('Advanced');
assert(b.total === 25, 'Beginner budget != 25');
assert(i.total === 50, 'Intermediate budget != 50');
assert(a.total === 100, 'Advanced budget != 100');

// Scenario presence
import('../lib/scenario-catalog.js').then(async ({ SCENARIOS }) => {
  const ids = Object.keys(SCENARIOS || {});
  assert(ids.length >= 8, 'Less than 8 scenarios registered');

  // Run a dry newRound using a stub builder to confirm packet counts
  const diffs = ['Beginner','Intermediate','Advanced'];
  for (const d of diffs) {
    const { total } = packetBudgetForDifficulty(d);
    const { packets } = await newRound({ difficulty: d, profile: ids[0], buildScenario: async ({ totalPackets }) => ({ packets: Array.from({length: totalPackets}, (_,k)=>({ id: `p${k}`, ts: Date.now()+k})), evidenceIds: [], briefing: '' }) });
    assert(packets.length === total, `newRound count mismatch for ${d}`);
  }
  console.log('SMOKE OK: budgets 25/50/100 and scenarios>=8');
}).catch((e)=>{
  console.error('SMOKE FAIL: could not import scenarios', e.message);
  process.exit(1);
});


