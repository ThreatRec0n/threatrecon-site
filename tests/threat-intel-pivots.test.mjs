import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  buildThreatIntelPivots,
  buildThreatIntelPivotRows,
  flattenThreatIntelPivots,
  getPivotProviderUrl,
  normalizeIocForPivot,
  refangIocForPivot,
} from '../public/assets/js/threat-intel-pivots.js';
import { buildActionableBlocklist, buildIOCActionability } from '../public/assets/js/advanced-analysis.js';
import { extractIOCs, isPrivateOrReservedIp } from '../public/assets/js/utils.js';

const appSource = readFileSync(new URL('../public/assets/js/app.js', import.meta.url), 'utf8');
const utilitySource = readFileSync(new URL('../public/assets/js/threat-intel-pivots.js', import.meta.url), 'utf8');

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

const defangedUrl = 'hxxp://malicious-example-not-real[.]tld/path?a=1&b=2';
const normalizedUrl = normalizeIocForPivot(defangedUrl, 'url');
assert.strictEqual(normalizedUrl.original, defangedUrl, 'original defanged IOC should remain unchanged');
assert.strictEqual(normalizedUrl.normalizedValue, 'http://malicious-example-not-real.tld/path?a=1&b=2', 'defanged URL should be refanged for pivot URLs');
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

const publicIpRows = buildThreatIntelPivotRows(buildIOCActionability(
  { ips: ['45.67.89.123'], localIndicators: [], domains: [], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [] },
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

const duplicateRows = buildThreatIntelPivotRows([
  { type: 'domain', value: 'DupExample.tld', actionable: true, reason: 'Domain indicator requiring validation.', recommendedAction: 'Validate.' },
  { type: 'domain', value: 'dupexample.tld', actionable: true, reason: 'Domain indicator requiring validation.', recommendedAction: 'Validate.' },
]);
assert.strictEqual(duplicateRows.length, 1, 'duplicate IOCs should not create duplicate pivot rows after normalization');

const flattened = flattenThreatIntelPivots(publicIpRows);
assert(flattened.some(p => p.provider === 'GreyNoise Community' && p.url), 'flattened JSON export rows should include provider URLs');
assert(flattenThreatIntelPivots(nonActionableRows).some(p => p.actionable === false && p.reason), 'non-actionable export rows should include false and reason');

const extracted = extractIOCs(defangedUrl);
assert(extracted.urls.includes(defangedUrl), 'defanged URLs should be extracted while preserving original display value');
const defangedRows = buildThreatIntelPivotRows(buildIOCActionability(extracted, false, undefined, isPrivateOrReservedIp));
assert(defangedRows[0].refanged, 'defanged pivot row should flag refanged lookup');
assert.strictEqual(defangedRows[0].ioc, defangedUrl, 'defanged pivot row should keep original IOC visible');

const blocklistRows = buildIOCActionability(
  { ips: ['45.67.89.123'], localIndicators: ['10.0.0.5'], domains: ['example.com'], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [sha256] },
  false,
  undefined,
  isPrivateOrReservedIp,
);
const blocklist = buildActionableBlocklist(blocklistRows);
assert(blocklist.includes('45.67.89.123'), 'public IP should remain in actionable blocklist');
assert(blocklist.includes(sha256), 'hash should remain in actionable blocklist');
assert(!blocklist.includes('10.0.0.5'), 'private IP should stay excluded from blocklist export');
assert(!blocklist.includes('example.com'), 'reserved demo domain should stay excluded from blocklist export');

assert(appSource.includes('target="_blank" rel="noopener noreferrer"'), 'external pivot links should include target and rel attributes');
assert(appSource.includes('## Threat Intel Pivots'), 'Markdown export should include Threat Intel Pivots section');
assert(appSource.includes('threatIntelPivots'), 'JSON report should include threatIntelPivots field');
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|apiKey|API_KEY/i.test(utilitySource), 'pivot utility must not make automatic API calls or use API keys');
assert(!/serverless|app\/api|pages\/api/i.test(utilitySource), 'pivot utility must not add backend/serverless behavior');

console.log('Threat intel pivots OK - provider URLs, refanging, actionability, exports, and privacy checks passed.');
