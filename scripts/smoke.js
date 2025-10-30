import { packetBudgetForDifficulty } from '../lib/round-engine.js';

function assert(cond, msg){ if(!cond){ console.error('Smoke fail:', msg); process.exit(1);} }

const b = packetBudgetForDifficulty('Beginner');
const i = packetBudgetForDifficulty('Intermediate');
const a = packetBudgetForDifficulty('Advanced');

assert(b.total === 25, 'Beginner total != 25');
assert(i.total === 50, 'Intermediate total != 50');
assert(a.total === 100, 'Advanced total != 100');

console.log('Smoke OK: budgets 25/50/100');


