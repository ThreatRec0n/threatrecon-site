import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  advancedDecode,
  buildApiRisk,
  buildAttackTable,
  buildStringsIntelligence,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';
import { extractEncodedBlobs, extractIOCs } from '../public/assets/js/utils.js';
import { BEHAVIOR_RULES, MITRE_MAP } from '../public/assets/js/rules.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SAMPLE_PATH = join(ROOT, 'test-samples', 'sample4-verification.txt');
const EXPECTED_IP = '192.0.2.55';
const EXPECTED_URL = 'http://example-verification-test.com/payload.ps1';
const EXPECTED_REGISTRY = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const MANGLED_REGISTRY_PATH = 'U:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const EXPECTED_PATH = 'C:\\Users\\Public\\verify-test.ps1';
const EXPECTED_HASH = '111111111111111111111111111111111111111111111111111111111111111e';

function analyze(input) {
  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const mitreSet = new Set();
  behaviors.forEach(b => String(b.tech || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => mitreSet.add(t)));
  if ((iocs.ips || []).length || (iocs.urls || []).length || (iocs.domains || []).length) mitreSet.add('T1071');
  const attackTable = buildAttackTable(behaviors, [...mitreSet], MITRE_MAP);
  const peTriage = parsePE(input);
  const apiRisk = buildApiRisk(peTriage);
  const stringsIntelligence = buildStringsIntelligence(input);
  const draftYara = generateDraftYara({
    iocs,
    category: 'Suspicious Script',
    apiRisk,
    stringsIntelligence,
    behaviors,
    isDemo: false,
  });
  const draftSigma = generateDraftSigma(input, attackTable);
  const decoded = advancedDecode(input, extractEncodedBlobs(input));
  return { iocs, decoded, draftYara, draftSigma };
}

function allIocValues(iocs) {
  return Object.values(iocs).flat().map(String);
}

function countValue(values, expected) {
  return values.filter(v => v === expected).length;
}

function check(name, pass, actual) {
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${status}: ${name}`);
  console.log(`  actual: ${actual}`);
  return pass;
}

const input = readFileSync(SAMPLE_PATH, 'utf8');
const first = analyze(input);
const second = analyze(input);
const iocValues = allIocValues(first.iocs);
const lowerDomains = (first.iocs.domains || []).map(d => String(d).toLowerCase());
const decodedStrings = first.decoded.map(d => d.decoded);
const hashValues = [...(first.iocs.md5 || []), ...(first.iocs.sha1 || []), ...(first.iocs.sha256 || [])];

const results = [
  check(
    `CHECK 1: IP ${EXPECTED_IP} is present in extracted IOCs`,
    iocValues.includes(EXPECTED_IP),
    JSON.stringify({ ips: first.iocs.ips, localIndicators: first.iocs.localIndicators }),
  ),
  check(
    `CHECK 2: URL ${EXPECTED_URL} is present in extracted IOCs`,
    (first.iocs.urls || []).includes(EXPECTED_URL),
    JSON.stringify(first.iocs.urls),
  ),
  check(
    `CHECK 3: registry key appears exactly once and ${MANGLED_REGISTRY_PATH} is absent`,
    countValue(first.iocs.registry || [], EXPECTED_REGISTRY) === 1 &&
      !iocValues.includes(MANGLED_REGISTRY_PATH) &&
      (first.iocs.paths || []).includes(EXPECTED_PATH),
    JSON.stringify({ registry: first.iocs.registry, paths: first.iocs.paths }),
  ),
  check(
    'CHECK 4: corrected 64-character hash is present under a hash category',
    hashValues.includes(EXPECTED_HASH),
    JSON.stringify({ md5: first.iocs.md5, sha1: first.iocs.sha1, sha256: first.iocs.sha256 }),
  ),
  check(
    'CHECK 5: extracted domains are empty and Sigma has no bare "Test" term',
    !lowerDomains.includes('threatrecon.io') &&
      !lowerDomains.includes('www.threatrecon.io') &&
      !lowerDomains.includes('test') &&
      lowerDomains.length === 0 &&
      !/^\s+- "Test"\s*$/m.test(first.draftSigma),
    JSON.stringify({
      domains: first.iocs.domains,
      sigmaHasBareTest: /^\s+- "Test"\s*$/m.test(first.draftSigma),
    }),
  ),
  check(
    'CHECK 6: deobfuscated content contains Write-Output and whoami',
    decodedStrings.some(d => /Write-Output/.test(d) && /whoami/.test(d)),
    JSON.stringify(first.decoded.map(d => ({ type: d.type, decoded: d.decoded }))),
  ),
  check(
    'CHECK 7: repeated YARA and Sigma generation is deterministic',
    first.draftYara === second.draftYara && first.draftSigma === second.draftSigma,
    JSON.stringify({
      yaraEqual: first.draftYara === second.draftYara,
      sigmaEqual: first.draftSigma === second.draftSigma,
    }),
  ),
  check(
    'CHECK 8: YARA output contains no ellipsis truncation',
    !/"[^"\n]*\.\.\."/.test(first.draftYara),
    first.draftYara,
  ),
];

const passed = results.filter(Boolean).length;
console.log(`${passed}/8 checks passed`);
process.exit(passed === 8 ? 0 : 1);
