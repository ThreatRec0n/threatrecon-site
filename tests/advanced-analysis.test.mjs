import assert from 'node:assert';
import {
  advancedDecode,
  buildApiRisk,
  buildIOCActionability,
  compareSamples,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';

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
  ip => ip === '127.0.0.1',
);
assert(iocRows.find(r => r.value === '8.8.8.8')?.actionable, 'public IP should be actionable');
assert.strictEqual(iocRows.find(r => r.value === '203.0.113.10')?.actionable, false, 'demo documentation IP should not be actionable');
assert.strictEqual(iocRows.find(r => r.value === '127.0.0.1')?.actionable, false, 'loopback should not be actionable');

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
