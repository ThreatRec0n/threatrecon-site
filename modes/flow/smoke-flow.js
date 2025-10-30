// modes/flow/smoke-flow.js
import FlowEngine from './FlowEngine.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scenarioPath = resolve(__dirname, 'flow-scenarios/flow-bank-heist.json');
const scenario = JSON.parse(readFileSync(scenarioPath, 'utf8'));
const engine = new FlowEngine({ scenarioJson: scenario, difficulty: 'intermediate' });
const start = engine.start();
console.log('Flow start:', start.currentStage, 'allowed', start.allowedPickCount, 'seedNos len', start.seedNos.length);
if (!start.seedNos || start.seedNos.length === 0) {
  console.error('No seed packets found');
  process.exit(1);
}
const inspected = engine.inspectPacket(start.seedNos[0]);
console.log('inspected tags:', inspected.revealedTags);
const adv = engine.advanceStage();
console.log('advanced ->', adv.currentStage);


