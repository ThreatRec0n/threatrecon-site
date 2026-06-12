import assert from 'node:assert';
import {
  advancedDecode,
  buildActionableBlocklist,
  buildApiRisk,
  buildDetectionEngineering,
  buildIOCActionability,
  compareSamples,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';
import { extractIOCs, isPrivateOrReservedIp } from '../public/assets/js/utils.js';

const noPe = parsePE('VirtualAllocEx WriteProcessMemory CreateRemoteThread');
assert.strictEqual(noPe.detected, false, 'API strings must not imply PE detection');
assert.deepStrictEqual(noPe.imports, [], 'no-header input must not have parsed imports');
assert(noPe.suspiciousApiStrings.includes('VirtualAllocEx'), 'API string scan should still surface API names');

const apiRisk = buildApiRisk(noPe);
assert(apiRisk.some(x => x.api === 'VirtualAllocEx' && x.detectedAs === 'string only'), 'API risk should label string-only APIs');

const yara = generateDraftYara({
  iocs: { urls: ['http://evil.test/payload'], domains: [], registry: ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'], paths: [], mutex: [] },
  category: 'Suspicious Script',
  apiRisk,
  stringsIntelligence: [],
  behaviors: [{ label: 'vssadmin delete shadows', sev: 'CRITICAL' }],
  isDemo: false,
});
assert(yara.includes('rule ThreatRecon_Suspicious_Script'), 'draft YARA rule name missing');
assert(yara.includes('vssadmin delete shadows'), 'draft YARA should include suspicious behavior');

const sigma = generateDraftSigma('powershell -enc AAAA; vssadmin delete shadows /all /quiet', [{ techniqueId: 'T1059.001' }]);
assert(sigma.includes('status: experimental'), 'draft Sigma should be experimental');
assert(sigma.includes('attack.t1059_001'), 'draft Sigma should include MITRE tag');

const iocRows = buildIOCActionability(
  { ips: ['8.8.8.8', '203.0.113.10'], localIndicators: ['127.0.0.1'], domains: ['example.com'], urls: [], emails: [], registry: [], paths: [], mutex: [], md5: [], sha1: [], sha256: [] },
  true,
  ip => /^203\.0\.113\./.test(ip),
  isPrivateOrReservedIp,
);
assert.strictEqual(iocRows.find(r => r.value === '8.8.8.8')?.actionable, true, 'public resolver should remain actionable as a public IP');
assert.strictEqual(iocRows.find(r => r.value === '203.0.113.10')?.actionable, false, 'demo documentation IP should not be actionable');
assert.strictEqual(iocRows.find(r => r.value === '127.0.0.1')?.actionable, false, 'loopback should not be actionable');

const safeDemoInput = [
  'powershell -enc SQBFAFgAOwA=',
  'http://example.com/payload.exe',
  'http://billing-docs.example.com/files/update.dat',
  'http://203.0.113.44/update',
  '8.8.8.8 8.8.4.4 1.1.1.1 1.0.0.1 9.9.9.9',
  '203.0.113.44 198.51.100.27 192.0.2.55',
  'localhost 127.0.0.1 10.0.0.9 172.16.5.4 192.168.1.20 169.254.1.2 0.0.0.0 255.255.255.255',
  'example.org example.net sub.example.com internal.test docs.example bad.invalid service.localhost',
].join('\n');
const safeIocs = extractIOCs(safeDemoInput);
const safeRows = buildIOCActionability(safeIocs, false, undefined, isPrivateOrReservedIp);
const rowFor = value => safeRows.find(r => r.value === value);
assert(safeIocs.ips.includes('8.8.8.8'), '8.8.8.8 should still be extracted');
assert.strictEqual(rowFor('8.8.8.8')?.actionable, true, '8.8.8.8 should remain actionable as a public IP');
assert(safeIocs.urls.includes('http://example.com/payload.exe'), 'example.com URL should still be extracted');
assert.strictEqual(rowFor('http://example.com/payload.exe')?.actionable, false, 'example.com URL should not be actionable');
assert(safeIocs.localIndicators.includes('203.0.113.44'), '203.0.113.44 should be extracted as documentation/reserved context');
assert.strictEqual(rowFor('203.0.113.44')?.actionable, false, '203.0.113.44 should not be actionable');
assert.strictEqual(rowFor('http://203.0.113.44/update')?.actionable, false, 'URL hosted on documentation IP should not be actionable');
assert(safeIocs.localIndicators.includes('127.0.0.1'), '127.0.0.1 should be extracted as local context');
assert.strictEqual(rowFor('127.0.0.1')?.actionable, false, '127.0.0.1 should not be actionable');
['10.0.0.9', '172.16.5.4', '192.168.1.20', '169.254.1.2', '0.0.0.0', '255.255.255.255'].forEach(ip => {
  assert(safeIocs.localIndicators.includes(ip), `${ip} should be local context`);
});
['example.org', 'example.net', 'sub.example.com', 'internal.test', 'docs.example', 'bad.invalid', 'service.localhost'].forEach(domain => {
  assert.strictEqual(rowFor(domain)?.actionable, false, `${domain} should not be actionable`);
});
assert(!safeIocs.domains.includes('localhost'), 'bare localhost should not be extracted as a domain IOC');
const safeBlocklist = buildActionableBlocklist(safeRows);
['http://example.com/payload.exe', '203.0.113.44', 'http://203.0.113.44/update', 'localhost', 'example.org', 'example.net', 'sub.example.com', 'internal.test', 'docs.example', 'bad.invalid', 'service.localhost'].forEach(value => {
  assert(!safeBlocklist.includes(value), `${value} should be excluded from blocklist`);
});
const huntingOutput = buildDetectionEngineering({
  draftYara: 'rule demo { condition: true }',
  draftSigma: 'title: demo',
  huntingQueries: [{ value: '8.8.8.8', splunk: 'index=* "8.8.8.8"', defender: 'DeviceNetworkEvents | where RemoteIP == "8.8.8.8"', elastic: 'destination.ip: "8.8.8.8"' }],
  blocklist: safeBlocklist,
});
assert(huntingOutput.splunk.some(q => q.includes('8.8.8.8')), 'hunting queries may include extracted safe/demo indicators');
assert(huntingOutput.firewallBlocklist.includes('8.8.8.8'), 'firewall blocklist may include public IPs that require validation');
assert(!huntingOutput.dnsBlocklist.includes('example.com'), 'DNS blocklist must not include reserved demo domains');

const actionableInput = 'powershell -enc SQBFAFgAOwA=\nhttp://suspicious-domain.invalid-example-not-real.tld/payload.exe\n45.67.89.123';
const actionableIocs = extractIOCs(actionableInput);
const actionableRows = buildIOCActionability(actionableIocs, false, undefined, isPrivateOrReservedIp);
const actionableBlocklist = buildActionableBlocklist(actionableRows);
assert.strictEqual(actionableRows.find(r => r.value === '45.67.89.123')?.actionable, true, 'public non-reserved IP should remain actionable');
assert.strictEqual(actionableRows.find(r => r.value === 'http://suspicious-domain.invalid-example-not-real.tld/payload.exe')?.actionable, true, 'non-reserved URL should remain actionable');
assert(actionableBlocklist.includes('45.67.89.123'), 'actionable public IP should appear in blocklist');
assert(actionableBlocklist.includes('http://suspicious-domain.invalid-example-not-real.tld/payload.exe'), 'actionable non-reserved URL should appear in blocklist');

const cmp = compareSamples(
  'powershell -enc AAAA http://one.example.com mimikatz',
  'powershell -enc BBBB http://one.example.com mimikatz',
  [{ rx: /mimikatz/i, label: 'Credential dumping tool signature', tech: 'T1003' }],
  [{ rx: /powershell/i, name: 'PowerShell_Test' }],
);
assert(cmp.similarityScore > 0, 'comparison should produce a similarity score');
assert(cmp.sharedYara.includes('PowerShell_Test'), 'comparison should include shared YARA hits');
assert(cmp.sharedMitre.includes('T1003'), 'comparison should include shared MITRE techniques');

const decoded = advancedDecode('[char]112+[char]111+[char]119+[char]101+[char]114+[char]115+[char]104+[char]101+[char]108+[char]108', []);
assert(decoded.some(d => d.decoded.includes('powershell')), 'advanced deobfuscation should decode PowerShell char arrays');

console.log('Advanced analysis OK — PE, API, YARA, Sigma, IOC actionability, comparison, and deobfuscation checks passed.');
