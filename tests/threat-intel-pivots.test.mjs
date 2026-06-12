import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  buildThreatIntelPivots,
  buildThreatIntelPivotRows,
  classifyPivotActionability,
  flattenThreatIntelPivots,
  flattenSkippedThreatIntelPivots,
  getPivotProviderUrl,
  normalizeIocForPivot,
  refangIocForPivot,
} from '../public/assets/js/threat-intel-pivots.js';
import { buildActionableBlocklist, buildIOCActionability } from '../public/assets/js/advanced-analysis.js';
import { extractIOCs, isPrivateOrReservedIp } from '../public/assets/js/utils.js';

const appSource = readFileSync(new URL('../public/assets/js/app.js', import.meta.url), 'utf8');
const utilitySource = readFileSync(new URL('../public/assets/js/threat-intel-pivots.js', import.meta.url), 'utf8');

function assertSkipped(value, type, message) {
  const actionability = classifyPivotActionability(value, type);
  assert.strictEqual(actionability.actionable, false, message);
  assert.strictEqual(buildThreatIntelPivots(value, type).length, 0, `${value} should not create provider buttons`);
}

const sha256 = 'a'.repeat(64);
const sha256Pivots = buildThreatIntelPivots(sha256, 'hash');
assert.deepStrictEqual(
  sha256Pivots.map(p => p.provider),
  ['VirusTotal', 'MalwareBazaar', 'ThreatFox', 'AlienVault OTX'],
  'SHA256 hash should create VT, MalwareBazaar, ThreatFox, and OTX pivots',
);

assert.strictEqual(normalizeIocForPivot('B'.repeat(32), 'hash').type, 'md5', 'MD5 hash should be recognized by exact length');
assert.strictEqual(normalizeIocForPivot('C'.repeat(40), 'hash').type, 'sha1', 'SHA1 hash should be recognized by exact length');
assert.strictEqual(normalizeIocForPivot('not-a-random-hash', 'hash').type, 'hash', 'random strings must not be promoted to a concrete hash type');

assertSkipped('test', 'domain', 'test should be skipped from main pivot links');
assertSkipped('LOCAL', 'domain', 'LOCAL should be skipped from main pivot links');
assertSkipped('localhost', 'domain', 'localhost should be skipped from main pivot links');
assertSkipped('example.com', 'domain', 'example.com should be skipped from main pivot links');
assertSkipped('demo-value.test', 'domain', '.test domains should be skipped from main pivot links');
assertSkipped('demo-hidden-service.onion', 'domain', 'obvious demo domains should be skipped from main pivot links');
assertSkipped('printer.local', 'domain', '.local domains should be skipped from main pivot links');
assertSkipped('192.168.1.5', 'ip', 'private IP should be skipped from main pivot links');
assertSkipped('127.0.0.1', 'ip', 'loopback IP should be skipped from main pivot links');
assertSkipped('203.0.113.10', 'ip', 'documentation IP should be skipped from main pivot links');
assert.strictEqual(classifyPivotActionability('http://203.0.113.10/payload.bin', 'url').reason, 'Skipped: documentation IP range', 'URL hosted on documentation IP should keep documentation IP reason');
assertSkipped('8.8.8.8', 'ip', 'resolver IP should be skipped from main pivot links');

const defangedUrl = 'hxxp://bad-domain[.]com/path';
const normalizedUrl = normalizeIocForPivot(defangedUrl, 'url');
assert.strictEqual(normalizedUrl.original, defangedUrl, 'original defanged IOC should remain unchanged');
assert.strictEqual(normalizedUrl.normalizedValue, 'http://bad-domain.com/path', 'defanged URL should be refanged for pivot URLs');
assert.strictEqual(refangIocForPivot('hxxps[://]example[.]com/a'), 'https://example.com/a', 'safe refanging should handle hxxps and [://]');
assert(
  getPivotProviderUrl('virustotal', normalizedUrl.normalizedValue, 'url').includes(encodeURIComponent(normalizedUrl.normalizedValue)),
  'URL pivot values should be safely encoded',
);

const domainPivots = buildThreatIntelPivots('suspicious-example-not-real.tld', 'domain');
assert(domainPivots.some(p => p.provider === 'VirusTotal'), 'domain should create VirusTotal pivot');
assert(domainPivots.some(p => p.provider === 'URLhaus'), 'domain should create URLhaus pivot');
assert(domainPivots.some(p => p.provider === 'ThreatFox'), 'domain should create ThreatFox pivot');
assert(domainPivots.some(p => p.provider === 'AlienVault OTX'), 'domain should create OTX pivot');

const realDomainPivots = buildThreatIntelPivots('malicious-example-bad.com', 'domain');
assert(realDomainPivots.some(p => p.provider === 'VirusTotal'), 'real-looking domain should create VirusTotal pivot');
assert(realDomainPivots.some(p => p.provider === 'URLhaus'), 'real-looking domain should create URLhaus pivot');
assert(realDomainPivots.some(p => p.provider === 'ThreatFox'), 'real-looking domain should create ThreatFox pivot');
assert(realDomainPivots.some(p => p.provider === 'AlienVault OTX'), 'real-looking domain should create OTX pivot');

const publicIpRows = buildThreatIntelPivotRows(buildIOCActionability(
  { ips: ['45.155.205.233'], localIndicators: [], domains: [], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [] },
  false,
  undefined,
  isPrivateOrReservedIp,
));
const publicIpProviders = publicIpRows[0].pivots.map(p => p.provider);
['VirusTotal', 'AlienVault OTX', 'AbuseIPDB', 'GreyNoise Community'].forEach(provider => {
  assert(publicIpProviders.includes(provider), `public IPv4 should include ${provider}`);
});

const nonActionableRows = buildThreatIntelPivotRows(buildIOCActionability(
  { ips: [], localIndicators: ['10.0.0.5'], domains: ['example.com'], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [] },
  false,
  undefined,
  isPrivateOrReservedIp,
));
assert.strictEqual(nonActionableRows.find(r => r.ioc === '10.0.0.5')?.pivots.length, 0, 'private IP should not get full pivots');
assert.strictEqual(nonActionableRows.find(r => r.ioc === '10.0.0.5')?.actionable, false, 'private IP should be marked non-actionable');
assert.strictEqual(nonActionableRows.find(r => r.ioc === 'example.com')?.pivots.length, 0, 'example.com should not get threat-intel pivots');
assert.strictEqual(nonActionableRows.find(r => r.ioc === 'example.com')?.actionable, false, 'example.com should be marked non-actionable');
assert(flattenSkippedThreatIntelPivots(nonActionableRows).some(p => p.reason.startsWith('Skipped:')), 'skipped rows should include professional skipped reasons');

const duplicateRows = buildThreatIntelPivotRows([
  { type: 'domain', value: 'DupExample.tld', actionable: true, reason: 'Domain indicator requiring validation.', recommendedAction: 'Validate.' },
  { type: 'domain', value: 'dupexample.tld', actionable: true, reason: 'Domain indicator requiring validation.', recommendedAction: 'Validate.' },
]);
assert.strictEqual(duplicateRows.length, 1, 'duplicate IOCs should not create duplicate pivot rows after normalization');

const duplicateSkippedRows = buildThreatIntelPivotRows([
  { type: 'domain', value: 'LOCAL', actionable: false, reason: 'Reserved documentation, local, or test domain; training/demo indicator only.', recommendedAction: 'Keep for context.' },
  { type: 'domain', value: 'local', actionable: false, reason: 'Reserved documentation, local, or test domain; training/demo indicator only.', recommendedAction: 'Keep for context.' },
]);
assert.strictEqual(duplicateSkippedRows.length, 1, 'duplicate skipped indicators should not create duplicate skipped rows');

const flattened = flattenThreatIntelPivots(publicIpRows);
assert(flattened.some(p => p.provider === 'GreyNoise Community' && p.url), 'flattened JSON export rows should include provider URLs');
assert.strictEqual(flattenThreatIntelPivots(nonActionableRows).length, 0, 'non-actionable indicators should not appear in actionable pivot export');
assert(flattenSkippedThreatIntelPivots(nonActionableRows).some(p => p.actionable === false && p.reason), 'skipped JSON export rows should include false and reason');

const extracted = extractIOCs(defangedUrl);
assert(extracted.urls.includes(defangedUrl), 'defanged URLs should be extracted while preserving original display value');
const defangedRows = buildThreatIntelPivotRows(buildIOCActionability(extracted, false, undefined, isPrivateOrReservedIp));
assert(defangedRows[0].refanged, 'defanged pivot row should flag refanged lookup');
assert.strictEqual(defangedRows[0].ioc, defangedUrl, 'defanged pivot row should keep original IOC visible');
assert(defangedRows[0].pivots.some(p => p.url.includes(encodeURIComponent('http://bad-domain.com/path'))), 'defanged URL should use refanged value in pivot URL');

const blocklistRows = buildIOCActionability(
  { ips: ['45.155.205.233', '8.8.8.8', '203.0.113.10'], localIndicators: ['10.0.0.5', '192.168.1.5', '127.0.0.1'], domains: ['example.com', 'demo.test', 'printer.local', 'malicious-example-bad.com'], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [sha256] },
  false,
  undefined,
  isPrivateOrReservedIp,
);
const blocklist = buildActionableBlocklist(blocklistRows);
assert(blocklist.includes('45.155.205.233'), 'public IP should remain in actionable blocklist');
assert(blocklist.includes(sha256), 'hash should remain in actionable blocklist');
assert(blocklist.includes('malicious-example-bad.com'), 'real-looking domain should remain in actionable blocklist');
assert(!blocklist.includes('10.0.0.5'), 'private IP should stay excluded from blocklist export');
assert(!blocklist.includes('192.168.1.5'), 'private IP should stay excluded from blocklist export');
assert(!blocklist.includes('127.0.0.1'), 'loopback IP should stay excluded from blocklist export');
assert(!blocklist.includes('8.8.8.8'), 'resolver IP should stay excluded from blocklist export');
assert(!blocklist.includes('203.0.113.10'), 'documentation IP should stay excluded from blocklist export');
assert(!blocklist.includes('example.com'), 'reserved demo domain should stay excluded from blocklist export');
assert(!blocklist.includes('demo.test'), '.test domain should stay excluded from blocklist export');
assert(!blocklist.includes('printer.local'), '.local domain should stay excluded from blocklist export');

assert(appSource.includes('target="_blank" rel="noopener noreferrer"'), 'external pivot links should include target and rel attributes');
assert(appSource.includes('## Threat Intel Pivots'), 'Markdown export should include Threat Intel Pivots section');
assert(appSource.includes('## Non-actionable / Training Indicators'), 'Markdown export should include skipped indicator section');
assert(appSource.includes('threatIntelPivots'), 'JSON report should include threatIntelPivots field');
assert(appSource.includes('skippedThreatIntelPivots'), 'JSON report should include skippedThreatIntelPivots field');
assert(appSource.includes('Non-actionable / Training Indicators'), 'UI should include skipped indicator section');
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|apiKey|API_KEY/i.test(utilitySource), 'pivot utility must not make automatic API calls or use API keys');
assert(!/serverless|app\/api|pages\/api/i.test(utilitySource), 'pivot utility must not add backend/serverless behavior');

console.log('Threat intel pivots OK - provider URLs, refanging, actionability, exports, and privacy checks passed.');
