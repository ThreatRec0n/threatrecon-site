import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  advancedDecode,
  buildActionableBlocklist,
  buildApiRisk,
  buildAttackTable,
  buildDetectionEngineering,
  buildIOCActionability,
  buildStringsIntelligence,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from '../public/assets/js/advanced-analysis.js';
import { md5 } from '../public/assets/js/md5.js';
import {
  extractEncodedBlobs,
  extractIOCs,
  isPrivateOrReservedIp,
  shannonEntropy,
} from '../public/assets/js/utils.js';
import { BEHAVIOR_RULES, MITRE_MAP, YARA_RULES } from '../public/assets/js/rules.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SAMPLE_PATH = join(ROOT, 'test-samples', 'sample4-verification.txt');

function sha1Hex(input) {
  return createHash('sha1').update(input, 'utf8').digest('hex');
}

function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function suspiciousCommands(input) {
  return input.split(/\n/).map(s => s.trim()).filter(s =>
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

function analyze(input) {
  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const yaraHits = YARA_RULES.filter(r => r.rx.test(input));
  const deobfuscated = advancedDecode(input, extractEncodedBlobs(input));
  const entropy = shannonEntropy(input);
  const peTriage = parsePE(input);
  const apiRisk = buildApiRisk(peTriage);
  const stringsIntelligence = buildStringsIntelligence(input);
  const mitreSet = new Set();
  behaviors.forEach(b => String(b.tech || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => mitreSet.add(t)));
  if ((iocs.ips || []).length || (iocs.urls || []).length || (iocs.domains || []).length) mitreSet.add('T1071');
  const mitre = [...mitreSet];
  const attackTable = buildAttackTable(behaviors, mitre, MITRE_MAP);
  const draftYara = generateDraftYara({ iocs, category: 'Suspicious Script', apiRisk, stringsIntelligence, behaviors, isDemo: false });
  const draftSigma = generateDraftSigma(input, attackTable);
  const iocActionability = buildIOCActionability(iocs, false, undefined, isPrivateOrReservedIp);
  const blocklist = buildActionableBlocklist(iocActionability);
  const huntingQueries = buildHuntingQueries(iocs, suspiciousCommands(input));
  const detectionEngineering = buildDetectionEngineering({ draftYara, draftSigma, huntingQueries, blocklist });
  return {
    timestamp: 'verification',
    sha256: sha256Hex(input),
    sha1: sha1Hex(input),
    md5: md5(input),
    entropy,
    iocs,
    behaviors: behaviors.map(b => ({ sev: b.sev, label: b.label, tech: b.tech })),
    yaraHits: yaraHits.map(y => ({ name: y.name, desc: y.desc })),
    mitre,
    attackTable,
    peTriage,
    apiRisk,
    stringsIntelligence,
    deobfuscated,
    draftYara,
    draftSigma,
    iocActionability,
    blocklist,
    huntingQueries,
    detectionEngineering,
    iocCsvRows: iocActionability.map(row => ({
      type: row.type,
      value: row.value,
      source: 'ThreatRecon local extraction',
      confidence: row.confidence,
      notes: `actionable=${row.actionable ? 'yes' : 'no'} | ${row.reason} | ${row.recommendedAction}`,
    })),
    report: 'ThreatRecon verification report',
  };
}

function buildExports(report) {
  const json = JSON.stringify(report, null, 2);
  const markdown = `# ThreatRecon Triage Report\n\n## IOCs\n${Object.entries(report.iocs).filter(([, v]) => v.length).map(([k, v]) => `### ${k}\n${v.join('\n')}`).join('\n\n') || 'none'}\n\n## Draft YARA Rule\n\`\`\`yara\n${report.draftYara}\n\`\`\`\n\n## Draft Sigma Rule\n\`\`\`yaml\n${report.draftSigma}\n\`\`\`\n`;
  const iocCsv = ['type,value,source,confidence,notes'].concat(report.iocCsvRows.map(row =>
    [row.type, row.value, row.source, row.confidence, row.notes].map(csvEscape).join(',')
  )).join('\n');
  const blocklist = [
    '# ThreatRecon blocklist export',
    '# Actionable public IPs, domains, URLs, and hashes only',
    ...(report.blocklist.length ? report.blocklist : ['# No actionable IOCs found.']),
  ].join('\n');
  return {
    json,
    markdown,
    iocCsv,
    blocklist,
    yara: report.draftYara,
    sigma: report.draftSigma,
  };
}

function check(name, pass, actual) {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`);
  console.log(`  actual: ${actual}`);
  return pass;
}

const input = readFileSync(SAMPLE_PATH, 'utf8');
const report = analyze(input);
const exports = buildExports(report);
const results = [
  check('JSON export parses and has sha256', Boolean(JSON.parse(exports.json).sha256), exports.json.slice(0, 80)),
  check('Markdown export starts with report heading', exports.markdown.startsWith('# ThreatRecon Triage Report'), exports.markdown.split('\n')[0]),
  check('IOC CSV export has expected header', exports.iocCsv.startsWith('type,value,source,confidence,notes'), exports.iocCsv.split('\n')[0]),
  check('Blocklist export has expected heading', exports.blocklist.startsWith('# ThreatRecon blocklist export'), exports.blocklist.split('\n')[0]),
  check('YARA export starts with rule', exports.yara.trimStart().startsWith('rule '), exports.yara.split('\n')[0]),
  check('Sigma export starts with title', exports.sigma.trimStart().startsWith('title:'), exports.sigma.split('\n')[0]),
];

const passed = results.filter(Boolean).length;
console.log(`${passed}/6 export checks passed`);

const ipInput = '127.0.0.1 10.0.0.5 192.0.2.55 169.254.1.1 8.8.8.8';
const ipIocs = extractIOCs(ipInput);
const ipRows = buildIOCActionability(ipIocs, false, undefined, isPrivateOrReservedIp);
const ipValues = ['127.0.0.1', '10.0.0.5', '192.0.2.55', '169.254.1.1', '8.8.8.8'];
console.log('IP classification check:');
ipValues.forEach(ip => {
  const row = ipRows.find(r => r.value === ip);
  console.log(`  ${ip}: actionable=${row?.actionable ? 'yes' : 'no'} | type=${row?.type || 'missing'} | reason=${row?.reason || 'missing'}`);
});
const ipPass = ipRows.find(r => r.value === '127.0.0.1')?.reason.includes('Loopback') &&
  ipRows.find(r => r.value === '10.0.0.5')?.reason.includes('RFC 1918') &&
  ipRows.find(r => r.value === '192.0.2.55')?.reason.includes('RFC 5737') &&
  !/loopback/i.test(ipRows.find(r => r.value === '192.0.2.55')?.reason || '') &&
  ipRows.find(r => r.value === '169.254.1.1')?.reason.includes('RFC 3927') &&
  ipRows.find(r => r.value === '8.8.8.8')?.actionable === true;
console.log(`${ipPass ? 'PASS' : 'FAIL'}: IP classification reasons`);

process.exit(passed === 6 && ipPass ? 0 : 1);
