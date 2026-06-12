import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildApiRisk,
  buildStringsIntelligence,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';
import { extractIOCs } from '../public/assets/js/utils.js';
import { BEHAVIOR_RULES } from '../public/assets/js/rules.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SAMPLES = [
  ['sample1.txt', 'utf8'],
  ['sample2.ps1', 'utf8'],
  ['sample3.bin', 'latin1'],
  ['sample4-verification.txt', 'utf8'],
];

function sampleInput(name, encoding) {
  const buf = readFileSync(join(ROOT, 'test-samples', name));
  return encoding === 'latin1' ? buf.toString('latin1') : buf.toString('utf8');
}

function section(rule, start, end) {
  const s = rule.indexOf(start);
  const e = end ? rule.indexOf(end, s + start.length) : -1;
  return s >= 0 ? rule.slice(s, e >= 0 ? e : undefined).trimEnd() : '';
}

function identifiers(stringsSection) {
  return [...stringsSection.matchAll(/\$([a-z][a-z0-9_]*\d+)\s*=/g)].map(m => m[1]);
}

function checkRule(name, rule) {
  const stringsSection = section(rule, 'strings:', 'condition:');
  const conditionSection = section(rule, 'condition:');
  const ids = identifiers(stringsSection);
  const prefixes = new Set(ids.map(id => id.replace(/\d+$/, '')));
  const hasMultipleCategories = prefixes.size > 1;
  const hasOldFlatCondition = /\b\d+\s+of\s+them\b/.test(conditionSection);
  const referencedPrefixes = [...conditionSection.matchAll(/\$([a-z][a-z0-9_]*)\*/g)].map(m => m[1]);
  const emptyRefs = referencedPrefixes.filter(p => !prefixes.has(p));
  const pass = (!hasMultipleCategories || !hasOldFlatCondition) && emptyRefs.length === 0;

  console.log(`## ${name}`);
  console.log(stringsSection);
  console.log(conditionSection);
  console.log(`${pass ? 'PASS' : 'FAIL'}: categories=${[...prefixes].join(', ') || 'none'} | emptyRefs=${emptyRefs.join(', ') || 'none'}`);
  console.log('');
  return pass;
}

const results = SAMPLES.map(([name, encoding]) => {
  const input = sampleInput(name, encoding);
  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const peTriage = parsePE(input);
  const apiRisk = buildApiRisk(peTriage);
  const stringsIntelligence = buildStringsIntelligence(input);
  const rule = generateDraftYara({ iocs, category: 'Suspicious Script', apiRisk, stringsIntelligence, behaviors, isDemo: false });
  return checkRule(name, rule);
});

const passed = results.filter(Boolean).length;
console.log(`${passed}/${SAMPLES.length} YARA condition checks passed`);
process.exit(passed === SAMPLES.length ? 0 : 1);
