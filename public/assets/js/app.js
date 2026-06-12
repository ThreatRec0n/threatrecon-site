/* =====================================================================
   ThreatRecon Malware Triage Workbench — app.js
   Orchestration, rendering, scoring, reporting, and event wiring.

   SAFETY BOUNDARIES (enforced throughout this file):
   - Everything runs locally in the browser. There are no network/API calls.
   - No eval() and no Function() constructor are used anywhere.
   - Uploaded/pasted content is NEVER executed — it is only read as text,
     hashed, pattern-matched, and decoded for display.
   - All user-controlled values are escaped with escapeHtml() before being
     inserted via innerHTML, or written with textContent.
   - Files are never uploaded anywhere and never persisted server-side.
   ===================================================================== */

import {
  escapeHtml, sha256, sha1, shannonEntropy,
  extractEncodedBlobs, classifyStrings, extractIOCs,
  isPrivateOrReservedIp as isLocalPrivateIp,
} from './utils.js';
import {
  advancedDecode,
  buildApiRisk,
  buildAttackTable,
  buildAttackTimeline,
  buildActionableBlocklist,
  buildDetectionEngineering,
  buildIOCActionability,
  buildStringsIntelligence,
  compareSamples,
  generateDraftSigma,
  generateDraftYara,
  parsePE,
} from './advanced-analysis.js';
import { md5 } from './md5.js';
import {
  BEHAVIOR_RULES, YARA_RULES, MITRE_MAP, DEMO_SAMPLE,
  KB_DATA, TOOLS_DATA, CS_DATA, SB_DATA, DYNAMIC_ANALYSIS_CONFIG,
} from './rules.js';
import {
  buildThreatIntelPivotRows,
  flattenThreatIntelPivots,
  NON_ACTIONABLE_PIVOT_REASON,
  THREAT_INTEL_PIVOT_PRIVACY_NOTE,
} from './threat-intel-pivots.js';

const $ = (id) => document.getElementById(id);

/* ─── Mutable UI state ──────────────────────────────────────────────────── */
let fileContent = '';
let fileName = '';
let lastReport = null;
let analysisMode = 'deep'; // deep | quick | ioc | deobf
let workflowMode = 'SOC Triage';
let lastComparison = null;

/* Upload allow / block lists for the File Safety Gate. */
const TEXT_EXT = ['txt', 'log', 'ps1', 'bat', 'cmd', 'sh', 'py', 'js', 'vbs', 'php', 'rb', 'pl', 'conf', 'json', 'xml', 'ini', 'csv', 'yar'];
const PE_BINARY_EXT = ['exe', 'dll', 'bin', 'com', 'sys', 'scr'];
const ALLOWED_EXT = TEXT_EXT.concat(PE_BINARY_EXT);
const BLOCKED_EXT = ['msi', 'jar', 'iso', 'img', 'docm', 'xlsm', 'zip', '7z', 'rar'];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB browser-safe local analysis cap
const MAX_INPUT_CHARS = 2 * 1024 * 1024;

/* Single source of truth for the demo notice (UI report, Markdown, JSON all match). */
const DEMO_NOTICE = 'Demo sample. Safe text-only artifact. Not real malware. Network indicators use documentation ranges, example.com/example.org domains, or clearly labeled demo placeholders. No real malicious infrastructure is included.';

/* Which result sections are shown for each analysis mode. */
const MODE_SECTIONS = {
  deep: null, // null = show everything
  quick: new Set(['static', 'score', 'score-explain', 'ioc', 'ioc-action', 'behavior', 'script', 'pe', 'api-risk', 'yara', 'draft-yara', 'draft-sigma', 'mitre', 'attack-table', 'timeline', 'entropy', 'capabilities', 're-guidance', 'hunting', 'detection', 'reputation', 'recommendations', 'dynamic', 'report']),
  ioc: new Set(['static', 'score', 'ioc', 'ioc-action', 'hunting', 'detection', 'reputation']),
  deobf: new Set(['static', 'score', 'deobf', 'strings', 'strings-intel', 'entropy', 'script']),
};

/* ─── Small UI helpers ──────────────────────────────────────────────────── */
function showToast(msg) {
  const t = $('toast');
  t.textContent = '\u2713 ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function setStatus(state, txt) {
  $('status-led').className = state === 'analyzing' ? 'status-led spin' : 'status-led';
  $('status-txt').textContent = txt;
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = $('page-' + id);
  if (page) page.classList.add('active');
  const tab = document.querySelector(`.nav-tab[data-page="${id}"]`);
  if (tab) tab.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchInputTab(id) {
  document.querySelectorAll('.itab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  document.querySelectorAll('.ipane').forEach(p => p.classList.toggle('active', p.id === 'ipane-' + id));
}

function setMode(mode) {
  analysisMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

function setWorkflowMode(mode) {
  workflowMode = mode || 'SOC Triage';
  document.querySelectorAll('.workflow-btn').forEach(b => b.classList.toggle('active', b.dataset.workflow === workflowMode));
}

/* Apply section visibility for the active analysis mode. */
function applyModeVisibility() {
  const allowed = MODE_SECTIONS[analysisMode];
  document.querySelectorAll('[data-section]').forEach(node => {
    const name = node.getAttribute('data-section');
    node.hidden = allowed ? !allowed.has(name) : false;
  });
}

/* ─── File Safety Gate ──────────────────────────────────────────────────── */
function handleFile(file) {
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const blockedEl = $('file-blocked');
  const loadedEl = $('file-loaded');
  blockedEl.style.display = 'none';
  loadedEl.style.display = 'none';

  const reject = (reason) => {
    fileContent = '';
    fileName = '';
    blockedEl.style.display = 'block';
    blockedEl.textContent = '\u26A0 Blocked: ' + reason + ' Nothing was uploaded or executed — analysis is local only.';
    showToast('Local file blocked');
  };

  if (file.size > MAX_UPLOAD_BYTES) {
    reject(`File exceeds the ${(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit (${file.size.toLocaleString()} bytes).`);
    return;
  }
  if (BLOCKED_EXT.includes(ext)) {
    reject(`".${ext}" is a binary/archive type this workbench refuses to read. Provide a text-based script, log, or config instead.`);
    return;
  }
  if (!ALLOWED_EXT.includes(ext)) {
    reject(`".${ext}" is not in the allowed text/script list.`);
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const result = ev.target.result;
    if (result instanceof ArrayBuffer) {
      const bytes = new Uint8Array(result);
      let out = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        out += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      fileContent = out;
    } else {
      fileContent = String(result || '');
    }
    fileName = file.name;
    loadedEl.style.display = 'block';
    // textContent — never innerHTML — so a crafted file name cannot inject markup.
    loadedEl.textContent = `\u2713 Loaded (local): ${fileName} \u2014 ${fileContent.length.toLocaleString()} bytes. Not uploaded anywhere.`;
  };
  if (PE_BINARY_EXT.includes(ext)) reader.readAsArrayBuffer(file);
  else reader.readAsText(file); // read locally only; the file is never executed.
}

/* ─── Scoring (six weighted components) ─────────────────────────────────── */
function computeScore(behaviors, iocs, yaraHits, entropy, deobfCount, capCount) {
  let behRaw = 0;
  behaviors.forEach(b => {
    if (b.sev === 'CRITICAL') behRaw += 20;
    else if (b.sev === 'HIGH') behRaw += 12;
    else if (b.sev === 'MED') behRaw += 6;
    else behRaw += 2;
  });
  const beh = Math.min(behRaw, 50);
  const iocScore = Math.min(
    iocs.ips.length * 5 + iocs.urls.length * 4 + iocs.domains.length * 3 +
    iocs.onion.length * 6 + iocs.md5.length * 3 + iocs.sha1.length * 3 +
    iocs.sha256.length * 3 + iocs.btc.length * 8 + iocs.cve.length * 4, 20);
  const yaraScore = Math.min(yaraHits.length * 8, 18);
  const entScore = entropy >= 7.2 ? 10 : entropy >= 6.5 ? 6 : entropy >= 5.0 ? 3 : 0;
  const deobfScore = Math.min(deobfCount * 4, 12);
  const capScore = Math.min(capCount * 3, 12);
  const total = Math.min(beh + iocScore + yaraScore + entScore + deobfScore + capScore, 100);
  return { total, beh, iocScore, yaraScore, entScore, deobfScore, capScore };
}

/* ─── Capability mapping ────────────────────────────────────────────────── */
function computeCapabilities(behaviors, iocs, yaraHits) {
  const caps = [];
  const add = (cls, desc) => { if (!caps.some(c => c.class === cls)) caps.push({ class: cls, desc }); };
  const labels = behaviors.map(b => b.label.toLowerCase());
  const has = (...kw) => labels.some(l => kw.some(k => l.includes(k)));

  if (has('lsass', 'credential', 'mimikatz', 'keylog', 'browser credential', 'vault')) add('Credential Access', 'Harvests credentials or session data via LSASS dump, browser vaults, keylogging, or credential-dumping tools.');
  if (has('ransom', 'shadow', 'backup deletion') || iocs.btc.length > 0) add('Ransomware Behavior', 'Performs ransomware actions such as deleting backups/shadow copies, encrypting data, or demanding cryptocurrency payment.');
  if (has('inject', 'reflective', 'remote thread', 'dll')) add('Code Injection', 'Injects code into other processes via reflective loading or remote process injection.');
  if (has('download', 'cradle', 'staging') || yaraHits.some(y => /loader|stager/i.test(y.name))) add('Downloader/Stager', 'Downloads or stages remote payloads from external infrastructure for later execution.');
  if (has('scheduled task', 'registry run', 'service creation', 'winlogon', 'appinit')) add('Persistence', 'Establishes persistence via scheduled tasks, Run keys, services, or logon hijacks.');
  if (has('cron', 'init.d', 'systemd', 'shell profile', 'authorized_keys')) add('Linux Persistence', 'Establishes Linux persistence via cron, systemd/init.d, shell profiles, or SSH authorized_keys.');
  if (has('defender', 'av exclusion', 'firewall', 'hidden window', 'event log', 'security process')) add('Defense Evasion', 'Disables AV/Defender, modifies the firewall, hides windows, or clears logs to evade detection.');
  if (has('obfuscat', 'packed', 'encrypted', 'base64', 'tick obfuscation') || yaraHits.some(y => /Base64|Encrypt|Obfuscated/i.test(y.name))) add('Obfuscation/Evasion', 'Employs packing, encryption, encoding, or string obfuscation to hinder analysis.');
  if (has('tor', 'c2', 'network download', 'cobalt strike', 'meterpreter')) add('Command & Control', 'Communicates with external C2 infrastructure (HTTP or Tor) to receive commands or exfiltrate data.');
  if (has('exfil', 'stealer', 'infostealer') || yaraHits.some(y => /Infostealer/i.test(y.name))) add('Data Exfiltration', 'Steals sensitive data (credentials, files, browser data) and exfiltrates it to a remote server.');
  if (has('cryptominer', 'xmrig', 'monero', 'pool') || yaraHits.some(y => /cryptominer/i.test(y.name))) add('Cryptomining', 'Drops or configures a cryptocurrency miner to hijack system resources.');
  if (has('webshell', 'php', 'request input') || yaraHits.some(y => /PHP_Webshell/i.test(y.name))) add('Web Shell', 'Contains or deploys a web shell for persistent remote access over HTTP.');
  if (has('recon', 'reconnaissance', 'scanning', 'discovery')) add('Discovery', 'Enumerates host, user, and network information for situational awareness.');
  if (iocs.cve.length > 0) add('Exploit Targeting', 'References specific CVE identifiers, indicating exploit code or vulnerability targeting.');
  if (iocs.btc.length > 0) add('Payment Infrastructure', 'Contains cryptocurrency addresses used for ransom or illicit payments.');
  if (iocs.registry.length > 0) add('Registry Persistence', 'Uses registry keys for persistence across reboots.');
  return caps;
}

function computeMalwareType(behaviors, iocs, yaraHits, score) {
  const labels = behaviors.map(b => b.label.toLowerCase());
  const has = (...kw) => labels.some(l => kw.some(k => l.includes(k)));
  if (has('ransom', 'shadow copy') || iocs.btc.length > 0 || yaraHits.some(y => /Ransomware/i.test(y.name))) return 'Ransomware';
  if (has('webshell', 'php eval', 'request input') || yaraHits.some(y => /PHP_Webshell/i.test(y.name))) return 'Web Shell';
  if (has('cryptominer', 'xmrig', 'monero') || yaraHits.some(y => /cryptominer/i.test(y.name))) return 'Cryptominer';
  if (has('lsass', 'mimikatz', 'credential dumping')) return 'Credential Harvester';
  if (has('browser credential', 'stealer', 'exfil', 'keylog') || yaraHits.some(y => /Infostealer/i.test(y.name))) return 'Infostealer';
  if (has('inject', 'reflective')) return 'Loader';
  if (has('download', 'cradle', 'staging')) return 'Downloader/Stager';
  if (has('rat', 'remote access', 'backdoor', 'meterpreter')) return 'RAT/Backdoor';
  if (has('recon', 'reconnaissance', 'scanning', 'discovery')) return 'Recon Script';
  if (behaviors.length === 0 && Object.values(iocs).flat().length === 0) return 'Likely Benign';
  if (score >= 30) return 'Suspicious Script';
  return behaviors.length > 0 ? 'Unknown Malware' : 'Likely Benign';
}

function computeRecommendations(caps, malwareType, behaviors, iocs) {
  const rec = [];
  rec.push('Triage in an isolated VM or trusted dynamic sandbox (e.g. ANY.RUN or Triage) for full behavioral analysis — never on production hosts.');
  if (iocs.ips.length || iocs.domains.length || iocs.urls.length || iocs.onion.length) {
    rec.push('Validate extracted IOCs before blocking. Only block confirmed malicious public IPs, domains, URLs, or hashes. Do not block reserved, local, documentation, or known public resolver indicators from demo/static context.');
  }
  if (caps.some(c => c.class === 'Credential Access') || /Harvester/.test(malwareType)) {
    rec.push('Assume credentials on affected hosts are compromised; force credential rotation and revoke active sessions.');
    rec.push('Enforce MFA and review authentication logs for anomalous access.');
  }
  if (caps.some(c => c.class === 'Ransomware Behavior') || malwareType === 'Ransomware') {
    rec.push('Verify offline backup integrity before reconnecting; remove shadow-copy deletion artifacts.');
  }
  if (caps.some(c => c.class === 'Persistence' || c.class === 'Registry Persistence' || c.class === 'Linux Persistence')) {
    rec.push('Enumerate and remove scheduled tasks, Run keys, services, cron jobs, and SSH authorized_keys entries.');
  }
  if (caps.some(c => c.class === 'Data Exfiltration') || malwareType === 'Infostealer') {
    rec.push('Review network/endpoint telemetry for large or unusual outbound transfers; notify affected users.');
  }
  if (caps.some(c => c.class === 'Cryptomining') || malwareType === 'Cryptominer') {
    rec.push('Monitor CPU/GPU utilization and block known mining pools with egress filtering.');
  }
  if (caps.some(c => c.class === 'Command & Control')) rec.push('Alert on Tor/anonymization traffic and block it at the perimeter if not explicitly allowed.');
  if (caps.some(c => c.class === 'Obfuscation/Evasion')) rec.push('Use CyberChef/FLOSS to fully unpack embedded payloads before deeper static analysis.');
  if (caps.some(c => c.class === 'Exploit Targeting')) rec.push('Assess patch status against referenced CVEs and apply missing updates.');
  rec.push('Pivot extracted IOCs through VirusTotal, MalwareBazaar, OTX, and ThreatFox to map related infrastructure.');
  return rec;
}

/* ─── Static PE + script triage (local heuristics only) ─────────────────── */
const PE_IMPORTS = [
  'VirtualAlloc', 'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread',
  'LoadLibraryA', 'LoadLibraryW', 'GetProcAddress', 'WinExec', 'ShellExecute',
  'InternetOpen', 'InternetOpenUrl', 'URLDownloadToFile', 'CryptEncrypt',
  'IsDebuggerPresent', 'CheckRemoteDebuggerPresent', 'NtQueryInformationProcess',
  'RegSetValue', 'CreateService', 'OpenSCManager', 'SetWindowsHookEx', 'GetAsyncKeyState',
];
const PACKER_HINTS = ['UPX', 'ASPack', 'Themida', 'VMProtect', 'Enigma', 'PECompact', 'MPRESS', 'FSG', 'Obsidium'];
const PACKED_SECTIONS = ['.upx', 'upx0', 'upx1', '.packed', '.aspack', '.adata', '.petite', '.mpress'];

function safeByteAt(input, offset) {
  return offset >= 0 && offset < input.length ? input.charCodeAt(offset) & 0xff : 0;
}

function readU16LE(input, offset) {
  return safeByteAt(input, offset) | (safeByteAt(input, offset + 1) << 8);
}

function readU32LE(input, offset) {
  return (safeByteAt(input, offset) | (safeByteAt(input, offset + 1) << 8) |
    (safeByteAt(input, offset + 2) << 16) | (safeByteAt(input, offset + 3) << 24)) >>> 0;
}

function readAscii(input, offset, len) {
  let out = '';
  for (let i = 0; i < len; i++) {
    const c = safeByteAt(input, offset + i);
    if (!c) break;
    out += c >= 32 && c <= 126 ? String.fromCharCode(c) : '';
  }
  return out.trim();
}

function entropyOfSlice(input, offset, len) {
  if (offset < 0 || len <= 0 || offset >= input.length) return 0;
  return shannonEntropy(input.slice(offset, Math.min(input.length, offset + len)));
}

function analyzePE(input) {
  const hasMZ = input.length > 1 && input.charCodeAt(0) === 0x4d && input.charCodeAt(1) === 0x5a;
  const peOffset = hasMZ ? readU32LE(input, 0x3c) : -1;
  const hasPE = peOffset > 0 && peOffset + 6 < input.length && input.slice(peOffset, peOffset + 4) === 'PE\0\0';
  const machine = hasPE ? readU16LE(input, peOffset + 4) : 0;
  const archMap = {
    0x014c: 'x86 (IMAGE_FILE_MACHINE_I386)',
    0x8664: 'x64 (IMAGE_FILE_MACHINE_AMD64)',
    0x01c0: 'ARM',
    0xaa64: 'ARM64',
  };
  const sectionCount = hasPE ? Math.min(readU16LE(input, peOffset + 6), 24) : 0;
  const optSize = hasPE ? readU16LE(input, peOffset + 20) : 0;
  const sectionTable = hasPE ? peOffset + 24 + optSize : -1;
  const sections = [];
  for (let i = 0; i < sectionCount; i++) {
    const off = sectionTable + (i * 40);
    if (off + 40 > input.length) break;
    const name = readAscii(input, off, 8) || `(section ${i + 1})`;
    const rawSize = readU32LE(input, off + 16);
    const rawPtr = readU32LE(input, off + 20);
    const entropy = entropyOfSlice(input, rawPtr, Math.min(rawSize, 128 * 1024));
    sections.push({ name, rawSize, entropy });
  }
  const suspiciousApiStrings = PE_IMPORTS.filter(api => new RegExp(api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(input));
  const packerHints = PACKER_HINTS.filter(h => new RegExp(h, 'i').test(input));
  const packedSectionHits = sections.filter(s => PACKED_SECTIONS.some(p => s.name.toLowerCase().includes(p)));
  const highEntropySections = sections.filter(s => s.entropy >= 7.2);
  const readable = (input.match(/[ -~]{4,}/g) || []).length;
  const packedIndicators = [];
  if (shannonEntropy(input) >= 7.2) packedIndicators.push('Overall entropy above 7.2');
  if (readable < Math.max(8, input.length / 5000)) packedIndicators.push('Few readable strings for file size');
  if (packerHints.length) packedIndicators.push(`Compiler/packer hints: ${packerHints.join(', ')}`);
  if (packedSectionHits.length) packedIndicators.push(`Packed section names: ${packedSectionHits.map(s => s.name).join(', ')}`);
  if (highEntropySections.length) packedIndicators.push(`High-entropy sections: ${highEntropySections.map(s => `${s.name} (${s.entropy.toFixed(2)})`).join(', ')}`);
  return {
    detected: hasMZ || hasPE || sections.length > 0,
    hasMZ,
    hasPE,
    fileType: hasPE ? 'Windows PE executable or DLL-like content' : hasMZ ? 'MZ/DOS executable-like content' : 'No PE structure detected',
    architecture: hasPE ? (archMap[machine] || `Unknown machine 0x${machine.toString(16)}`) : 'Not available',
    sections,
    realImportTableParsed: false,
    imports: [],
    suspiciousApiStrings,
    packerHints,
    packedIndicators,
  };
}

const SCRIPT_RULES = {
  PowerShell: ['EncodedCommand', 'FromBase64String', 'IEX', 'Invoke-Expression', 'Invoke-WebRequest', 'DownloadString', 'Start-Process', 'Bypass', 'Hidden', 'NoProfile', 'Add-MpPreference', 'Set-MpPreference', 'AmsiUtils', 'amsiInitFailed'],
  JavaScript: ['eval', 'Function', 'ActiveXObject', 'WScript.Shell', 'mshta', 'document.write', 'atob', 'unescape', 'String.fromCharCode', 'XMLHttpRequest', 'fetch'],
  VBScript: ['CreateObject', 'WScript.Shell', 'MSXML2.XMLHTTP', 'ADODB.Stream', 'Shell.Application', 'Run', 'Exec'],
  Batch: ['certutil', 'bitsadmin', 'reg add', 'schtasks', 'vssadmin', 'bcdedit', 'wevtutil', 'net user', 'net group', 'whoami', 'ipconfig', 'taskkill', 'powershell'],
  Python: ['socket', 'subprocess', 'os.system', 'base64.b64decode', 'requests.get', 'exec', 'eval', 'marshal', 'pickle.loads'],
  HTA: ['<hta:application', 'mshta', 'ActiveXObject', 'VBScript', 'JScript', 'WScript.Shell'],
  'Office macro-style': ['AutoOpen', 'Document_Open', 'Auto_Open', 'Shell', 'CreateObject', 'WScript.Shell', 'PowerShell', 'URLDownloadToFile'],
};

function analyzeScripts(input) {
  return Object.entries(SCRIPT_RULES).map(([family, tokens]) => {
    const hits = tokens.filter(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(input));
    return { family, hits };
  }).filter(x => x.hits.length);
}

function analystConfidence(behaviors, iocs, yaraHits, capabilities) {
  const strong = behaviors.filter(b => ['CRITICAL', 'HIGH'].includes(b.sev)).length;
  const cats = new Set(capabilities.map(c => c.class));
  const iocCount = Object.values(iocs).flat().length;
  if (strong >= 3 || cats.size >= 3 || (strong >= 2 && yaraHits.length >= 2)) return 'High';
  if (strong >= 1 || iocCount >= 2 || yaraHits.length >= 1) return 'Medium';
  return 'Low';
}

function likelyCategory(malwareType, capabilities, iocs, behaviors) {
  const labels = behaviors.map(b => b.label.toLowerCase()).join(' ');
  const caps = capabilities.map(c => c.class).join(' ');
  if (/ransom/i.test(malwareType + caps + labels)) return 'Ransomware';
  if (/credential|stealer|harvester|keylog/i.test(malwareType + caps + labels)) return 'Credential Stealer';
  if (/backdoor|rat|command & control/i.test(malwareType + caps + labels)) return 'Backdoor';
  if (/miner|cryptomining/i.test(malwareType + caps + labels)) return 'Miner';
  if (/download|stager|loader/i.test(malwareType + caps + labels)) return 'Downloader';
  if ((iocs.emails || []).length && (iocs.urls || []).length) return 'Phishing Artifact';
  if (/script|powershell|javascript|vbscript|batch|python/i.test(malwareType + labels)) return 'Suspicious Script';
  return 'Unknown Suspicious';
}

function buildBehaviorTimeline(behaviors, scriptFindings, peTriage) {
  const lines = [];
  if (scriptFindings.length) lines.push('Script launcher or interpreter indicators observed.');
  if (behaviors.some(b => /download|staging|transfer/i.test(b.label))) lines.push('Payload retrieval or staging behavior indicated.');
  if (behaviors.some(b => /persistence|scheduled|registry|service/i.test(b.label))) lines.push('Persistence mechanism indicated.');
  if (behaviors.some(b => /credential|lsass|mimikatz/i.test(b.label))) lines.push('Credential access behavior indicated.');
  if (behaviors.some(b => /shadow|ransom|backup/i.test(b.label))) lines.push('Impact / ransomware preparation indicated.');
  if (peTriage.detected) lines.push('PE-like binary artifact should be reviewed for sections, packing, API strings, and imports if an import table is available.');
  return lines.length ? lines : ['No clear multi-stage behavior timeline inferred from static evidence.'];
}

function buildREGuidance(ctx) {
  const { peTriage, scriptFindings, capabilities, malwareType, iocs, behaviors } = ctx;
  const out = [];
  if (peTriage.detected) {
    out.push('Open the sample in PEStudio, Detect It Easy, or PE-bear for header/import review.');
    out.push('Review parsed imports when available, and compare suspicious API strings against process injection, networking, persistence, crypto, and anti-debug patterns.');
    out.push('Check section entropy and section names for packing before deeper disassembly.');
    out.push('Extract strings and compare them with ThreatRecon IOCs.');
    out.push('Use Ghidra or Cutter for deeper code review only in an authorized lab.');
  }
  if (scriptFindings.some(s => s.family === 'PowerShell')) {
    out.push('Decode PowerShell Base64 payloads and review web requests, output paths, execution policy bypass, hidden windows, and persistence commands.');
  }
  if (scriptFindings.some(s => ['JavaScript', 'VBScript', 'HTA', 'Office macro-style'].includes(s.family))) {
    out.push('Review script COM objects, ActiveX usage, download cradles, and shell execution chains before opening any linked artifact.');
  }
  if (capabilities.some(c => c.class === 'Credential Access')) {
    out.push('Hunt for LSASS access, procdump/comsvcs.dll usage, Mimikatz strings, and suspicious dump files in EDR process trees.');
  }
  if (/ransomware/i.test(malwareType) || capabilities.some(c => c.class === 'Ransomware Behavior')) {
    out.push('Check shadow copy deletion, extension changes, ransom-note paths, and backup deletion. Do not reconnect affected systems until containment is complete.');
  }
  if ((iocs.ips || []).length || (iocs.domains || []).length || (iocs.urls || []).length || (iocs.sha256 || []).length) {
    out.push('Pivot extracted IOCs manually in reputation tools, then add confirmed IOCs to SIEM, EDR, firewall, DNS, or proxy hunts.');
  }
  if (behaviors.length && !out.length) out.push('Use the behavior list as a triage checklist and confirm with controlled dynamic analysis if authorized.');
  return out.length ? out : ['No specific reverse-engineering guidance beyond standard strings, suspicious API strings, entropy, and IOC review.'];
}

function suspiciousCommands(input) {
  return input.split(/\n/).map(s => s.trim()).filter(s =>
    /(powershell|cmd\.exe|wscript|cscript|mshta|rundll32|regsvr32|certutil|bitsadmin|schtasks|vssadmin|curl|wget|python|subprocess|os\.system)/i.test(s)
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

function actionableExportNotes(iocActionability, blocklist) {
  const notes = [];
  const excluded = (iocActionability || []).filter(r => !r.actionable && ['ip', 'local_ip', 'domain', 'url'].includes(r.type));
  if (excluded.length) {
    const reasons = [...new Set(excluded.map(r => r.reason))].slice(0, 4);
    notes.push(`Excluded ${excluded.length} non-actionable network indicator(s) from blocklists: ${reasons.join('; ')}`);
  }
  if (!blocklist.length) {
    notes.push('No actionable blocklist entries were produced; extracted indicators were local, reserved, documentation, demo, or analyst-validation-only.');
  }
  return notes;
}

function blocklistItems(iocActionability) {
  return buildActionableBlocklist(iocActionability);
}

function iocRows(iocActionability) {
  return (iocActionability || []).map(row => ({
    type: row.type,
    value: row.value,
    source: 'ThreatRecon local extraction',
    confidence: row.confidence,
    notes: `actionable=${row.actionable ? 'yes' : 'no'} | ${row.reason} | ${row.recommendedAction}`,
  }));
}

function formatThreatIntelPivotsText(rows) {
  const flattened = flattenThreatIntelPivots(rows);
  if (!flattened.length) return 'No threat-intelligence pivots generated.';
  return flattened.map(p => {
    if (!p.url) return `- ${p.ioc} | ${p.type} | actionable=no | ${p.reason || NON_ACTIONABLE_PIVOT_REASON}`;
    return `- ${p.ioc} | ${p.type} | ${p.provider} | ${p.url} | ${p.note}`;
  }).join('\n');
}

function formatThreatIntelPivotsMarkdown(rows) {
  const flattened = flattenThreatIntelPivots(rows);
  if (!flattened.length) return '- none';
  return flattened.map(p => {
    if (!p.url) {
      return `- IOC: \`${p.ioc}\` | Type: ${p.type} | Provider: none | URL: none | Note: ${p.reason || NON_ACTIONABLE_PIVOT_REASON}`;
    }
    return `- IOC: \`${p.ioc}\` | Type: ${p.type} | Provider: ${p.provider} | URL: ${p.url} | Note: ${p.note}`;
  }).join('\n');
}

/* ─── Dynamic analysis handoff (external links only — manual analyst step) ─ */
function buildDynamicAnalysisNextSteps() {
  const cfg = DYNAMIC_ANALYSIS_CONFIG;
  return {
    summary: cfg.summary,
    warning: cfg.warning,
    reminder: cfg.reminder,
    services: cfg.services.map(s => ({
      name: s.name,
      url: s.url,
      category: s.category,
      bestFor: s.bestFor,
      useWhen: s.useWhen,
    })),
  };
}

function formatDynamicAnalysisReportText() {
  const cfg = DYNAMIC_ANALYSIS_CONFIG;
  const lines = [
    'NEXT STEP: DYNAMIC ANALYSIS',
    'ThreatRecon has completed local static triage. To confirm runtime behavior, submit the sample or extracted IOCs to a dedicated malware sandbox or reputation platform.',
    '',
    'Recommended external options (manual analyst handoff — ThreatRecon does not submit files or IOCs):',
  ];
  cfg.services.forEach(s => {
    lines.push(`- ${s.name} — ${s.bestFor}`);
  });
  lines.push('');
  lines.push('Reminder:');
  lines.push(cfg.reminder);
  return lines.join('\n');
}

function formatDynamicAnalysisMarkdown() {
  const cfg = DYNAMIC_ANALYSIS_CONFIG;
  const svcLines = cfg.services.map(s =>
    `- **${s.name}** — ${s.bestFor}\n  - Use when: ${s.useWhen}\n  - Link: ${s.url}`).join('\n');
  return `## Next Step: Dynamic Analysis

${cfg.summary}

> **Warning:** ${cfg.warning}

### Recommended external options (manual handoff)
${svcLines}

### Reminder
${cfg.reminder}

*ThreatRecon performs local static triage only. Dynamic analysis is a separate external step initiated by the analyst.*`;
}

function hasHashIOCs(iocs) {
  return (iocs.sha256 || []).length + (iocs.sha1 || []).length + (iocs.md5 || []).length > 0;
}

function hasNetworkIOCs(iocs) {
  return (iocs.ips || []).length + (iocs.urls || []).length + (iocs.domains || []).length + (iocs.onion || []).length > 0;
}

function shouldSuggestSandboxSubmit(behaviors, capabilities, malwareType) {
  if (/ransomware/i.test(malwareType)) return true;
  const capHit = capabilities.some(c =>
    /persistence|credential|ransomware|injection/i.test(c.class));
  if (capHit) return true;
  return behaviors.some(b =>
    /injection|persistence|credential|ransomware|LSASS|shadow copy/i.test(b.label));
}

function scrollToDynamicHandoff() {
  const el = $('dynamic-analysis-card');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateDynamicContextualActions(iocs, behaviors, capabilities, malwareType) {
  const wrap = $('dyn-context-actions');
  if (!wrap) return;
  const parts = [];
  if (hasHashIOCs(iocs)) {
    parts.push('<button type="button" class="btn-context dyn-scroll-handoff" data-action="hash">Pivot hash reputation</button>');
  }
  if (hasNetworkIOCs(iocs)) {
    parts.push('<button type="button" class="btn-context dyn-scroll-handoff" data-action="network">Pivot network IOCs</button>');
  }
  if (shouldSuggestSandboxSubmit(behaviors, capabilities, malwareType)) {
    parts.push('<button type="button" class="btn-context dyn-scroll-handoff" data-action="sandbox">Submit sample to sandbox</button>');
  }
  parts.push('<button type="button" class="btn-context dyn-scroll-sandbox">View Sandbox Directory</button>');
  if (!parts.length) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }
  // Static button markup only — parts are hardcoded strings, never user/analysis data.
  wrap.innerHTML = '<div class="dyn-context-label">Based on this analysis:</div><div class="dyn-context-btns">' + parts.join('') + '</div>';
  wrap.style.display = 'block';
}

/* ─── Structured analyst report (local, no API) ─────────────────────────── */
function generateAnalystReport(ctx) {
  const { input, total, verdict, behaviors, iocs, yaraHits, entropy, entropyCat,
    mitreList, h256, malwareType, capabilities, deobf, isDemo, confidence,
    category, timeline, huntingQueries, reGuidance, peTriage, scriptFindings,
    exportNotes, scores, workflowMode, stringsIntelligence, apiRisk, attackTable,
    draftYara, draftSigma, iocActionability, threatIntelPivotRows } = ctx;
  const criticals = behaviors.filter(b => b.sev === 'CRITICAL');
  const highs = behaviors.filter(b => b.sev === 'HIGH');
  const meds = behaviors.filter(b => b.sev === 'MED');
  const iocTotal = Object.values(iocs).flat().length;
  const sections = [];

  if (isDemo) {
    sections.push('DEMO NOTICE');
    let demoNote = DEMO_NOTICE;
    if ((iocs.onion || []).length) demoNote += ' Onion indicator is a demo placeholder and should not be treated as live infrastructure.';
    sections.push(demoNote + '\n');
  }

  sections.push('EXECUTIVE SUMMARY');
  sections.push(`Composite threat score: ${total}/100 — assessed as ${verdict} with ${confidence} confidence. ` +
    `The sample triggered ${behaviors.length} behavioral indicator(s) (${criticals.length} CRITICAL, ${highs.length} HIGH, ${meds.length} MEDIUM), ` +
    `${yaraHits.length} YARA-style local regex match(es), and ${iocTotal} extracted IOC(s). This assessment is local static analysis performed entirely in the browser and does not query any external threat-intelligence service.`);

  sections.push('\nANALYST CONFIDENCE');
  sections.push(`${confidence}. Confidence is based on the number and strength of behavior categories, IOC density, YARA-style matches, and static context.`);

  sections.push('\nANALYST WORKFLOW MODE');
  sections.push(`${workflowMode}. This changes report emphasis only; detection truth and scoring are unchanged.`);

  sections.push('\nKEY FINDINGS');
  if (criticals.length) sections.push('Critical: ' + criticals.map(b => b.label).join('; ') + '.');
  if (highs.length) sections.push('High: ' + highs.slice(0, 6).map(b => b.label).join('; ') + '.');
  if (meds.length) sections.push('Medium: ' + meds.slice(0, 6).map(b => b.label).join('; ') + '.');
  if (scriptFindings.length) sections.push('Script indicators: ' + scriptFindings.map(s => `${s.family} (${s.hits.join(', ')})`).join('; ') + '.');
  sections.push(`Static PE triage: ${peTriage.fileType}; architecture ${peTriage.architecture}; suspicious API strings: ${(peTriage.suspiciousApiStrings || []).join(', ') || 'none visible'}.`);

  sections.push('\nLIKELY MALWARE CATEGORY');
  sections.push(category);

  sections.push('\nSCORE EXPLANATION');
  sections.push(`Behavior score: ${scores.beh}; IOC score: ${scores.iocScore}; YARA score: ${scores.yaraScore}; entropy score: ${scores.entScore}; deobfuscation score: ${scores.deobfScore}; capability score: ${scores.capScore}. Final verdict follows the composite score threshold.`);

  sections.push('\nTECHNICAL INDICATORS');
  sections.push(`Shannon entropy is ${entropy.toFixed(3)} bits/byte (${entropyCat.toLowerCase()}), ` +
    (entropy >= 7.2 ? 'consistent with a packed/encrypted payload that should be unpacked before deeper analysis.'
      : entropy >= 6.5 ? 'suggesting obfuscation or compression layers.'
        : 'consistent with readable plain-text/script content.'));

  sections.push('\nMALWARE TYPE');
  sections.push(`Inferred classification (heuristic): ${malwareType}. ` +
    'Family and type labels are heuristic and require validation through dynamic analysis and reputable intelligence sources.');

  sections.push('\nATTRIBUTION');
  sections.push('Attribution is not assessed from static heuristics alone. This tool does not name threat actors or criminal groups from string matches. ' +
    'Any actor or family attribution must come from dynamic analysis, telemetry, and corroborated threat intelligence — not from this static report.');

  sections.push('\nCAPABILITY SUMMARY');
  sections.push(capabilities.length ? capabilities.map(c => `- ${c.class}: ${c.desc}`).join('\n') : 'No distinct capabilities identified.');

  sections.push('\nATT&CK MAPPING');
  sections.push(mitreList.length ? mitreList.map(t => MITRE_MAP[t] || t).join('\n') : 'No techniques mapped.');

  sections.push('\nATT&CK TABLE');
  sections.push(attackTable.length ? attackTable.map(r => `- ${r.tactic} | ${r.techniqueId} ${r.techniqueName} | Evidence: ${r.observedEvidence} | Confidence: ${r.confidence} | Detection: ${r.detectionIdea}`).join('\n') : 'No ATT&CK table rows generated.');

  sections.push('\nINDICATORS OF COMPROMISE');
  const iocLines = Object.entries(iocs).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join(', ')}`);
  sections.push(iocLines.length ? iocLines.join('\n') : 'No IOCs extracted.');
  if (exportNotes.length) sections.push('\nActionable export notes:\n' + exportNotes.map(n => `- ${n}`).join('\n'));

  sections.push('\nIOC ACTIONABILITY');
  sections.push(iocActionability.length ? iocActionability.map(r => `- ${r.type}: ${r.value} | actionable=${r.actionable ? 'yes' : 'no'} | ${r.reason} | ${r.recommendedAction}`).join('\n') : 'No IOC actionability rows generated.');

  sections.push('\nTHREAT INTEL PIVOTS');
  sections.push('Manual analyst pivots. ' + THREAT_INTEL_PIVOT_PRIVACY_NOTE);
  sections.push(formatThreatIntelPivotsText(threatIntelPivotRows));

  sections.push('\nSTRINGS INTELLIGENCE');
  sections.push(stringsIntelligence.length ? stringsIntelligence.map(c => `- ${c.name} (${c.confidence}): ${c.items.slice(0, 6).join('; ')}`).join('\n') : 'No high-signal string categories detected.');

  sections.push('\nAPI RISK TABLE');
  sections.push(apiRisk.length ? apiRisk.map(a => `- ${a.api} | ${a.category} | ${a.risk} | ${a.detectedAs} | ${a.why}`).join('\n') : 'No suspicious API imports or API strings detected.');

  sections.push('\nBEHAVIOR TIMELINE');
  sections.push(timeline.map(x => `- ${x.stage}: ${x.evidence.join('; ')} | Confidence: ${x.confidence}${x.technique ? ` | ${x.technique}` : ''} | Validate: ${x.validation}`).join('\n'));

  sections.push('\nDRAFT YARA RULE');
  sections.push(draftYara);

  sections.push('\nDRAFT SIGMA RULE');
  sections.push(draftSigma);

  sections.push('\nDEOBFUSCATED CONTENT');
  sections.push(deobf.length ? deobf.map(d => `[${d.type}] ${d.decoded.slice(0, 160)}`).join('\n') : 'No encoded/obfuscated blobs decoded.');

  sections.push('\nRECOMMENDED CONTAINMENT');
  if (isDemo) sections.push('Because this is demo mode, response actions are shown for analyst training only.');
  if ((iocs.localIndicators || []).length) sections.push('Note: loopback/local indicators (e.g. 127.0.0.1) are local-only and must NOT be blocked at the firewall or DNS layer or treated as external IOCs.');
  sections.push(ctx.recommendations.map(r => `- ${r}`).join('\n'));

  sections.push('\nRECOMMENDED HUNTING QUERIES');
  sections.push(huntingQueries.length ? huntingQueries.slice(0, 6).map(q => `- Splunk: ${q.splunk}\n  Defender: ${q.defender.replace(/\n/g, ' ')}\n  Elastic: ${q.elastic}`).join('\n') : 'No query templates generated.');

  sections.push('\nREVERSE ENGINEERING GUIDANCE');
  sections.push(reGuidance.map(g => `- ${g}`).join('\n'));

  sections.push('\n' + formatDynamicAnalysisReportText());

  sections.push('\nLIMITATIONS');
  sections.push('This report was generated by local, static, signature-based heuristics with no code execution and no external API calls. ' +
    'It cannot observe runtime behavior, decrypt packed payloads, resolve dynamically built strings, or attribute threat actors with confidence. ' +
    'Confirm findings by detonating the sample in a dedicated dynamic sandbox and correlating IOCs through reputable threat-intelligence sources. ' +
    `SHA-256 for pivoting: ${h256}.`);

  return sections.join('\n');
}

/* ─── Renderers (all untrusted values escaped) ──────────────────────────── */
function renderStatic(h256, h1, md5hash, input, entropy) {
  const links = [
    ['VT', `https://www.virustotal.com/gui/search/${encodeURIComponent(h256)}`, 'Search SHA-256 on VirusTotal'],
    ['Bazaar', `https://bazaar.abuse.ch/browse.php?search=sha256%3A${encodeURIComponent(h256)}`, 'Search hash on MalwareBazaar'],
    ['OTX', `https://otx.alienvault.com/indicator/file/${encodeURIComponent(h256)}`, 'AlienVault OTX'],
    ['ThreatFox', `https://threatfox.abuse.ch/browse/`, 'ThreatFox'],
  ];
  let html = `
    <div class="meta-row"><span class="meta-key">MD5</span><span class="meta-val hash">${escapeHtml(md5hash)}</span></div>
    <div class="meta-row"><span class="meta-key">SHA-1</span><span class="meta-val hash">${escapeHtml(h1)}</span></div>
    <div class="meta-row"><span class="meta-key">SHA-256</span><span class="meta-val hash">${escapeHtml(h256)}</span></div>
    <div class="meta-row"><span class="meta-key">Size</span><span class="meta-val">${input.length.toLocaleString()} bytes</span></div>
    <div class="meta-row"><span class="meta-key">Lines</span><span class="meta-val">${input.split('\n').length.toLocaleString()}</span></div>
    ${fileName ? `<div class="meta-row"><span class="meta-key">File</span><span class="meta-val">${escapeHtml(fileName)}</span></div>` : ''}
    <div class="meta-row"><span class="meta-key">Entropy</span><span class="meta-val">${entropy.toFixed(3)} bits/byte</span></div>`;
  links.forEach(([k, url, label]) => {
    html += `<div class="meta-row"><span class="meta-key">${escapeHtml(k)}</span><span class="meta-val"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} \u2197</a></span></div>`;
  });
  html += `<div class="meta-row"><span class="meta-val" style="font-size:9px;color:var(--text3)">SHA-256 and SHA-1 are calculated locally in the browser via SubtleCrypto. MD5 is calculated locally via a bundled RFC&nbsp;1321 implementation. All three hash the UTF-8 bytes of the input.</span></div>`;
  $('static-body').innerHTML = html;
}

function renderIOC(iocs) {
  const defs = [
    { key: 'ips', label: 'IP Addresses (external)', cls: 'ip', link: v => `https://www.shodan.io/host/${encodeURIComponent(v)}` },
    { key: 'localIndicators', label: 'Local / Loopback Indicators (not external IOCs)', cls: 'reg', link: null },
    { key: 'urls', label: 'URLs', cls: '', link: v => `https://urlscan.io/search/#${encodeURIComponent(v)}` },
    { key: 'domains', label: 'Domains', cls: 'domain', link: v => `https://urlscan.io/search/#${encodeURIComponent(v)}` },
    { key: 'onion', label: 'Onion Addresses', cls: 'domain', link: null },
    { key: 'md5', label: 'MD5 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'sha1', label: 'SHA-1 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'sha256', label: 'SHA-256 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'emails', label: 'Email Addresses', cls: '', link: null },
    { key: 'registry', label: 'Registry Keys', cls: 'reg', link: null },
    { key: 'paths', label: 'File Paths', cls: 'path', link: null },
    { key: 'mutex', label: 'Mutex / Mutant Indicators', cls: 'reg', link: null },
    { key: 'btc', label: 'BTC Addresses', cls: '', link: v => `https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(v)}` },
    { key: 'cve', label: 'CVE References', cls: '', link: v => `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(v)}` },
  ].filter(d => iocs[d.key] && iocs[d.key].length);

  const total = Object.values(iocs).flat().length;
  $('ioc-total').textContent = total + ' found';
  if (!defs.length) { $('ioc-body').innerHTML = '<div class="no-ioc">No IOCs extracted from this sample.</div>'; return; }

  let html = '';
  defs.forEach(d => {
    html += `<div class="ioc-group"><div class="ioc-type-head">${escapeHtml(d.label)}<span class="ioc-count">${iocs[d.key].length}</span></div>`;
    iocs[d.key].forEach(v => {
      const safe = escapeHtml(v);
      const url = d.link ? d.link(v) : null;
      html += url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="ioc-pill ${d.cls}" title="Pivot to threat intel">${safe}</a>`
        : `<span class="ioc-pill ${d.cls}">${safe}</span>`;
    });
    html += '</div>';
  });
  $('ioc-body').innerHTML = html;
}

function renderBehaviors(behaviors) {
  $('beh-total').textContent = behaviors.length + ' detected';
  $('beh-body').innerHTML = behaviors.length === 0
    ? '<div class="no-ioc">No behavioral indicators detected.</div>'
    : behaviors.map(b => {
      const tech = b.tech.split(',')[0].trim();
      const url = `https://attack.mitre.org/techniques/${tech.replace('.', '/')}`;
      return `<div class="finding-row"><span class="sev-tag sev-${escapeHtml(b.sev)}">${escapeHtml(b.sev)}</span><div><div class="find-text">${escapeHtml(b.label)}</div><div class="find-tech">${escapeHtml(b.tech)} &nbsp;<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">ATT&amp;CK \u2197</a></div></div></div>`;
    }).join('');
}

function renderEntropy(entropy) {
  let label, color, cat;
  if (entropy >= 7.2) { label = 'Packed, encrypted, or compressed binary'; color = 'var(--red)'; cat = 'CRITICAL — Likely packed/encrypted'; }
  else if (entropy >= 6.5) { label = 'Compressed data or obfuscated script'; color = 'var(--orange)'; cat = 'HIGH — Obfuscated/compressed'; }
  else if (entropy >= 5.0) { label = 'Encoded content or mixed binary/text'; color = 'var(--yellow)'; cat = 'MEDIUM — Possibly encoded'; }
  else { label = 'Normal text content — no packing detected'; color = 'var(--green)'; cat = 'LOW — Plain text'; }
  $('entropy-body').innerHTML = `
    <div class="entropy-wrap">
      <div class="entropy-val" style="color:${color}">${entropy.toFixed(2)}</div>
      <div style="flex:1">
        <div class="entropy-bar"><div class="entropy-fill" style="width:${(entropy / 8 * 100).toFixed(1)}%;background:${color}"></div></div>
        <div class="entropy-label">Shannon entropy — max 8.0 (perfectly random)</div>
      </div>
    </div>
    <div class="entropy-cat" style="color:${color}">${escapeHtml(cat)}</div>
    <div style="font-size:10px;color:var(--text3);font-family:var(--term);margin-top:6px">${escapeHtml(label)}</div>
    <div style="font-size:10px;color:var(--text3);font-family:var(--term);margin-top:10px">Thresholds: &gt;7.2 packed/encrypted \u00B7 &gt;6.5 obfuscated \u00B7 &gt;5.0 encoded \u00B7 &lt;5.0 normal</div>`;
  return cat;
}

function renderStrings(strings) {
  $('strings-body').innerHTML = strings.length === 0
    ? '<div class="no-ioc">No classified strings extracted.</div>'
    : strings.map(s => {
      const t = ['network', 'crypto', 'evasion', 'suspicious'].includes(s.type) ? s.type : 'suspicious';
      return `<div class="string-item"><span class="str-type ${t}">${escapeHtml(t.toUpperCase())}</span><span class="str-val">${escapeHtml(s.val)}</span></div>`;
    }).join('');
}

function renderStringsIntelligence(categories) {
  const body = $('strings-intel-body');
  if (!body) return;
  body.innerHTML = categories.length
    ? `<p class="field-hint">String categories are static indicators and require analyst validation.</p>` +
      categories.map(c => `<div class="query-card">
        <div class="query-title">${escapeHtml(c.name)} <span class="ioc-count">${escapeHtml(c.confidence)}</span></div>
        <div class="field-hint">${escapeHtml(c.explanation)}</div>
        <div>${c.items.map(v => `<span class="ioc-pill">${escapeHtml(v)}</span>`).join('')}</div>
      </div>`).join('')
    : '<div class="no-ioc">No high-signal strings grouped into intelligence categories.</div>';
}

function renderYara(allHits) {
  $('yara-total').textContent = allHits.length + ' matches';
  $('yara-body').innerHTML = allHits.length === 0
    ? '<div class="yara-empty">No YARA-style rules triggered.</div>'
    : allHits.map(y => `<div class="yara-hit"><div class="yara-name">${escapeHtml(y.name)}</div><div class="yara-desc">${escapeHtml(y.desc)}</div></div>`).join('');
}

function renderMitre(mitreList) {
  $('mitre-body').innerHTML = mitreList.length === 0
    ? '<div class="no-ioc">No techniques mapped.</div>'
    : mitreList.map(t => {
      const label = MITRE_MAP[t] || t;
      const url = `https://attack.mitre.org/techniques/${t.replace('.', '/')}`;
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="mitre-tag">${escapeHtml(label)}</a>`;
    }).join('');
}

function renderAttackTable(rows) {
  const body = $('attack-table-body');
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = '<div class="no-ioc">No ATT&CK table rows generated.</div>';
    return;
  }
  body.innerHTML = `<div class="tr-table-wrap"><table class="tr-table">
    <thead><tr><th>Tactic</th><th>Technique</th><th>Observed evidence</th><th>Confidence</th><th>Detection idea</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${escapeHtml(r.tactic)}</td>
      <td><a href="https://attack.mitre.org/techniques/${escapeHtml(r.techniqueId.replace('.', '/'))}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.techniqueId)}</a><br><span class="field-hint">${escapeHtml(r.techniqueName)}</span></td>
      <td>${escapeHtml(r.observedEvidence)}</td>
      <td>${escapeHtml(r.confidence)}</td>
      <td>${escapeHtml(r.detectionIdea)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderTimelineTable(rows) {
  const body = $('timeline-body');
  if (!body) return;
  body.innerHTML = rows.map(r => `<div class="query-card">
    <div class="query-title">${escapeHtml(r.stage)} <span class="ioc-count">${escapeHtml(r.confidence)}</span></div>
    <div>${r.evidence.map(e => `<div class="rec-item">• ${escapeHtml(e)}</div>`).join('')}</div>
    ${r.technique ? `<div class="find-tech">${escapeHtml(r.technique)}</div>` : ''}
    <div class="field-hint">Validation: ${escapeHtml(r.validation)}</div>
  </div>`).join('');
}

function renderApiRisk(rows) {
  const body = $('api-risk-body');
  if (!body) return;
  body.innerHTML = rows.length
    ? `<div class="tr-table-wrap"><table class="tr-table">
        <thead><tr><th>API</th><th>Category</th><th>Risk</th><th>Why it matters</th><th>Detected as</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.api)}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.risk)}</td><td>${escapeHtml(r.why)}</td><td>${escapeHtml(r.detectedAs)}</td></tr>`).join('')}</tbody>
      </table></div>`
    : '<div class="no-ioc">No suspicious API imports or API strings detected.</div>';
}

function renderGeneratedRule(targetId, rule, label) {
  const body = $(targetId);
  if (!body) return;
  body.innerHTML = `<p class="field-hint">Draft ${escapeHtml(label)} rule. Analyst review required before production use.</p>
    <pre class="rule-preview">${escapeHtml(rule)}</pre>
    <button class="btn-export copy-generated" data-copy-target="${escapeHtml(targetId)}">⧉ Copy ${escapeHtml(label)}</button>`;
}

function renderIOCActionability(rows) {
  const body = $('ioc-action-body');
  if (!body) return;
  body.innerHTML = rows.length
    ? `<div class="tr-table-wrap"><table class="tr-table">
        <thead><tr><th>Type</th><th>Value</th><th>Confidence</th><th>Actionable</th><th>Reason</th><th>Recommended action</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.value)}</td><td>${escapeHtml(r.confidence)}</td><td>${r.actionable ? 'yes' : 'no'}</td><td>${escapeHtml(r.reason)}</td><td>${escapeHtml(r.recommendedAction)}</td></tr>`).join('')}</tbody>
      </table></div>`
    : '<div class="no-ioc">No IOC actionability rows generated.</div>';
}

function renderDetectionEngineering(out) {
  const body = $('detection-body');
  if (!body) return;
  const blocks = [
    ['Draft Sigma', out.draftSigma],
    ['Draft YARA', out.draftYara],
    ['Splunk Queries', (out.splunk || []).join('\n\n')],
    ['Defender KQL', (out.defender || []).join('\n\n')],
    ['Elastic Queries', (out.elastic || []).join('\n\n')],
    ['Firewall Blocklist', (out.firewallBlocklist || []).join('\n')],
    ['DNS Blocklist', (out.dnsBlocklist || []).join('\n')],
    ['EDR Hash Hunt Suggestions', (out.edrHashHunts || []).join('\n')],
  ];
  body.innerHTML = blocks.map(([title, text], idx) => `<div class="query-card">
    <div class="query-title">${escapeHtml(title)}</div>
    <pre class="rule-preview" id="det-block-${idx}">${escapeHtml(text || 'No output generated.')}</pre>
    <button class="btn-export copy-generated" data-copy-target="det-block-${idx}">⧉ Copy ${escapeHtml(title)}</button>
  </div>`).join('');
}

function renderComparison(result) {
  const body = $('compare-body');
  if (!body) return;
  if (!result) {
    body.innerHTML = '<div class="no-ioc">Paste two samples and click Compare Samples. Comparison is local only.</div>';
    return;
  }
  const sharedIocLines = Object.entries(result.sharedIocs).filter(([, v]) => v.length)
    .map(([k, v]) => `<div class="meta-row"><span class="meta-key">${escapeHtml(k)}</span><span class="meta-val">${v.map(escapeHtml).join(', ')}</span></div>`).join('');
  body.innerHTML = `<div class="score-wrap">
      <div class="score-big">${result.similarityScore}</div>
      <div class="score-meta"><div class="score-label">Similarity / 100</div><div id="compare-verdict">${escapeHtml(result.possibleRelation)} possible relation</div></div>
    </div>
    <p class="field-hint">${escapeHtml(result.reasoning)}</p>
    <h4 class="dyn-section-title">Shared IOCs</h4>${sharedIocLines || '<div class="no-ioc">No shared IOCs.</div>'}
    <h4 class="dyn-section-title">Shared Strings</h4><div>${result.sharedStrings.map(s => `<span class="ioc-pill">${escapeHtml(s)}</span>`).join('') || '<div class="no-ioc">No shared strings.</div>'}</div>
    <h4 class="dyn-section-title">Shared Behaviors / Rules / ATT&CK</h4>
    <div>${result.sharedBehaviors.concat(result.sharedYara, result.sharedMitre).map(s => `<span class="ioc-pill hash">${escapeHtml(s)}</span>`).join('') || '<div class="no-ioc">No shared behavior, YARA, or ATT&CK overlap.</div>'}</div>
    <div class="export-row export-row--inline">
      <button class="btn-export" id="exp-compare-json">⇓ Comparison JSON</button>
      <button class="btn-export" id="exp-compare-md">⇓ Comparison Markdown</button>
    </div>`;
  const jsonBtn = $('exp-compare-json');
  const mdBtn = $('exp-compare-md');
  if (jsonBtn) jsonBtn.addEventListener('click', exportComparisonJSON);
  if (mdBtn) mdBtn.addEventListener('click', exportComparisonMarkdown);
}

function renderCapabilities(capabilities, malwareType) {
  $('capabilities-body').innerHTML = !capabilities.length
    ? '<div class="no-ioc">No specific capabilities detected.</div>'
    : '<div class="capabilities-list">' +
      capabilities.map(c => `<div class="capability-class">${escapeHtml(c.class)}</div><div class="capability-item">${escapeHtml(c.desc)}</div>`).join('') +
      `</div><div class="capability-item" style="margin-top:8px;font-style:italic;color:var(--text3)">Inferred Malware Type: ${escapeHtml(malwareType)}</div>`;
}

function renderRecommendations(rec) {
  $('recommendations-body').innerHTML = !rec.length
    ? '<div class="no-ioc">No specific recommendations.</div>'
    : rec.map(r => `<div class="rec-item">\u2022 ${escapeHtml(r)}</div>`).join('');
}

function renderPETriage(pe) {
  const body = $('pe-body');
  if (!body) return;
  const sectionRows = pe.sections.length
    ? pe.sections.map(s => `<div class="meta-row"><span class="meta-key">${escapeHtml(s.name)}</span><span class="meta-val">virtual ${Number(s.virtualSize || 0).toLocaleString()} · raw ${Number(s.rawSize).toLocaleString()} bytes · entropy ${s.entropy.toFixed(2)}${s.executable ? ' · executable' : ''}${s.writable ? ' · writable' : ''}${s.suspicious ? ' · suspicious' : ''}${s.notes?.length ? ` · ${s.notes.map(escapeHtml).join(', ')}` : ''}</span></div>`).join('')
    : `<div class="meta-row"><span class="meta-val">${pe.detected ? 'Section table not parsable from available text/bytes.' : 'No section table parsed because no MZ/PE structure was detected.'}</span></div>`;
  body.innerHTML = `
    <div class="meta-row"><span class="meta-key">Type guess</span><span class="meta-val">${escapeHtml(pe.fileType)}</span></div>
    <div class="meta-row"><span class="meta-key">DOS header</span><span class="meta-val">${pe.hasMZ ? 'true' : 'false'}</span></div>
    <div class="meta-row"><span class="meta-key">PE signature</span><span class="meta-val">${pe.hasPE ? 'true' : 'false'}</span></div>
    <div class="meta-row"><span class="meta-key">Architecture</span><span class="meta-val">${escapeHtml(pe.architecture)}</span></div>
    <div class="meta-row"><span class="meta-key">Timestamp</span><span class="meta-val">${escapeHtml(pe.timestamp || 'Not available')}</span></div>
    <div class="meta-row"><span class="meta-key">Subsystem</span><span class="meta-val">${escapeHtml(pe.subsystem || 'Not available')}</span></div>
    <div class="meta-row"><span class="meta-key">Image base</span><span class="meta-val">${escapeHtml(pe.imageBase || 'Not available')}</span></div>
    <div class="meta-row"><span class="meta-key">Entry point RVA</span><span class="meta-val">${escapeHtml(pe.entryPointRva || 'Not available')}</span></div>
    <div class="meta-row"><span class="meta-key">DLL characteristics</span><span class="meta-val">${(pe.dllCharacteristics || []).map(escapeHtml).join(', ') || 'none parsed'}</span></div>
    <h4 class="dyn-section-title">Sections</h4>${sectionRows}
    <h4 class="dyn-section-title">Imports</h4>
    ${(pe.imports || []).length ? pe.imports.map(x => `<span class="ioc-pill hash">${escapeHtml(x)}</span>`).join('') : '<div class="no-ioc">No PE import table entries parsed from available bytes.</div>'}
    <h4 class="dyn-section-title">Exports</h4>
    ${(pe.exports || []).length ? pe.exports.map(x => `<span class="ioc-pill">${escapeHtml(x)}</span>`).join('') : '<div class="no-ioc">No PE export table entries parsed from available bytes.</div>'}
    <h4 class="dyn-section-title">Suspicious API strings</h4>
    ${(pe.suspiciousApiStrings || []).length ? pe.suspiciousApiStrings.map(x => `<span class="ioc-pill hash">${escapeHtml(x)}</span>`).join('') : '<div class="no-ioc">No listed suspicious Windows API strings visible.</div>'}
    <h4 class="dyn-section-title">Packer / compiler hints</h4>
    ${(pe.packedIndicators.length ? pe.packedIndicators.map(x => `<div class="rec-item">• ${escapeHtml(x)}</div>`).join('') : '<div class="no-ioc">No strong packing indicators from local static heuristics.</div>')}
    ${(pe.warnings || []).length ? `<h4 class="dyn-section-title">Warnings</h4>${pe.warnings.map(x => `<div class="rec-item">• ${escapeHtml(x)}</div>`).join('')}` : ''}
    <p class="field-hint">Static PE Triage is a lightweight browser heuristic, not full binary reverse engineering.</p>`;
}

function renderScriptAnalysis(findings) {
  const body = $('script-body');
  if (!body) return;
  body.innerHTML = findings.length
    ? findings.map(f => `<div class="finding-row"><span class="sev-tag sev-MED">${escapeHtml(f.family)}</span><div><div class="find-text">${f.hits.map(escapeHtml).join(', ')}</div><div class="find-tech">Local script indicator match</div></div></div>`).join('')
    : '<div class="no-ioc">No PowerShell, JavaScript, VBScript, Batch, Python, HTA, or macro-style indicators detected.</div>';
}

function renderREGuidance(guidance) {
  const body = $('re-guidance-body');
  if (!body) return;
  body.innerHTML = guidance.map(g => `<div class="rec-item">• ${escapeHtml(g)}</div>`).join('');
}

function renderHuntingQueries(queries) {
  const body = $('hunting-body');
  if (!body) return;
  if (!queries.length) {
    body.innerHTML = '<div class="no-ioc">No IOC or suspicious command values available for query templates yet.</div>';
    return;
  }
  body.innerHTML = queries.map(q => `
    <div class="query-card">
      <div class="query-title">${escapeHtml(q.value)}</div>
      <pre>Splunk: ${escapeHtml(q.splunk)}</pre>
      <pre>Defender KQL:\n${escapeHtml(q.defender)}</pre>
      <pre>Elastic: ${escapeHtml(q.elastic)}</pre>
    </div>`).join('');
}

function renderThreatIntelPivots(rows) {
  const body = $('reputation-body');
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = '<div class="no-ioc">No actionable IOCs available for manual threat-intelligence pivots yet.</div>';
    return;
  }

  const order = ['Hashes', 'URLs', 'Domains', 'IP Addresses', 'Other Indicators'];
  const grouped = order.map(category => [category, rows.filter(row => row.category === category)])
    .filter(([, items]) => items.length);
  const hasOverflow = grouped.some(([, items]) => items.length > 10);
  let html = `
    <div class="pivot-intro">
      <strong>Manual analyst pivots.</strong> ${escapeHtml(THREAT_INTEL_PIVOT_PRIVACY_NOTE)}
      <div class="field-hint">Manual links for analyst validation. No automatic IOC submission.</div>
    </div>`;

  grouped.forEach(([category, items]) => {
    html += `<div class="pivot-group"><div class="ioc-type-head">${escapeHtml(category)}<span class="ioc-count">${items.length}</span></div>`;
    items.forEach((row, idx) => {
      const hiddenClass = idx >= 10 ? ' pivot-row--extra' : '';
      const buttons = row.pivots.length
        ? `<div class="pivot-buttons">${row.pivots.map(p => `<a class="pivot-provider" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(p.title)}" aria-label="${escapeHtml(p.ariaLabel)}">${escapeHtml(p.shortName)}</a>`).join('')}</div>`
        : `<div class="pivot-skip">${escapeHtml(row.nonPivotReason || NON_ACTIONABLE_PIVOT_REASON)}</div>`;
      html += `<div class="pivot-row${hiddenClass}">
        <div class="pivot-value-wrap">
          <code class="pivot-value">${escapeHtml(row.ioc)}</code>
          <div class="pivot-meta">
            <span>type: ${escapeHtml(row.type)}</span>
            <span>actionable: ${row.actionable ? 'yes' : 'no'}</span>
            ${row.actionabilityReason ? `<span>${escapeHtml(row.actionabilityReason)}</span>` : ''}
          </div>
          ${row.refangNote ? `<div class="pivot-refang-note">${escapeHtml(row.refangNote)}</div>` : ''}
        </div>
        ${buttons}
      </div>`;
    });
    html += '</div>';
  });
  if (hasOverflow) html += '<button type="button" class="btn-export pivot-toggle" id="pivot-show-all">Show all pivots</button>';
  body.innerHTML = html;

  const toggle = $('pivot-show-all');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.dataset.expanded === 'true';
      body.querySelectorAll('.pivot-row--extra').forEach(row => row.classList.toggle('pivot-row--visible', !expanded));
      toggle.dataset.expanded = expanded ? 'false' : 'true';
      toggle.textContent = expanded ? 'Show all pivots' : 'Show fewer pivots';
    });
  }
}

function renderDeobf(deobf) {
  if (!deobf.length) { $('deobf-body').innerHTML = '<div class="no-ioc">No encoded or obfuscated blobs detected.</div>'; return; }
  $('deobf-body').innerHTML = deobf.map(d => {
    let dec = d.decoded.length > 400 ? d.decoded.slice(0, 400) + '\u2026' : d.decoded;
    const raw = d.raw.length > 60 ? d.raw.slice(0, 60) + '\u2026' : d.raw;
    // Decoded content is ESCAPED — it is displayed as inert text, never executed.
    return `<div class="deobf-item"><div class="deobf-raw">${escapeHtml(raw)}</div><div class="deobf-decoded">${escapeHtml(dec)}</div><div class="deobf-type">${escapeHtml(d.type)}</div></div>`;
  }).join('');
}

function renderScore(scores, verdict) {
  const { total, beh, iocScore, yaraScore, entScore, deobfScore, capScore } = scores;
  $('score-num').textContent = total;
  const map = {
    'CRITICAL THREAT': ['vb-critical', '\u26A0 CRITICAL THREAT', 'var(--red)'],
    'HIGH THREAT': ['vb-high', '\u26A0 HIGH THREAT', 'var(--orange)'],
    'SUSPICIOUS': ['vb-medium', '\u26A0 SUSPICIOUS', 'var(--yellow)'],
    'POTENTIALLY UNWANTED': ['vb-low', '\u2139 POTENTIALLY UNWANTED', 'var(--green)'],
    'LIKELY BENIGN': ['vb-clean', '\u2713 LIKELY BENIGN', 'var(--accent)'],
  };
  const [cls, text, color] = map[verdict] || map['LIKELY BENIGN'];
  $('score-num').style.color = color;
  $('score-bar').style.background = color;
  setTimeout(() => { $('score-bar').style.width = total + '%'; }, 80);
  // cls/text come from fixed verdict map only — never from user input.
  $('verdict-wrap').innerHTML = `<span class="verdict-badge ${cls}">${escapeHtml(text)}</span>`;
  $('score-breakdown').textContent =
    `Behavioral +${beh}  |  IOC +${iocScore}  |  YARA +${yaraScore}  |  Entropy +${entScore}  |  Deobfuscation +${deobfScore}  |  Capability +${capScore}`;
}

function verdictFromScore(total) {
  return total >= 80 ? 'CRITICAL THREAT' : total >= 55 ? 'HIGH THREAT' : total >= 30 ? 'SUSPICIOUS' : total >= 10 ? 'POTENTIALLY UNWANTED' : 'LIKELY BENIGN';
}

/* ─── Build custom YARA rules from the user's pattern box ────────────────── */
function buildCustomRules() {
  const raw = $('custom-yara') ? $('custom-yara').value.trim() : '';
  const rules = [];
  if (!raw) return rules;
  raw.split(/\n+/).forEach((pat, idx) => {
    const p = pat.trim();
    if (!p) return;
    try {
      // RegExp construction only — never eval/Function. An invalid pattern is skipped.
      const rx = new RegExp(p, 'i');
      rules.push({ name: 'Custom_' + (idx + 1), rx, desc: 'Custom pattern: ' + p });
    } catch { /* ignore invalid regex */ }
  });
  return rules;
}

function showAnalysisError(message, error) {
  if (error) console.error('ThreatRecon analysis failed:', error);
  if ($('spinner')) $('spinner').classList.remove('show');
  if ($('btn-analyze')) {
    $('btn-analyze').disabled = false;
    $('btn-analyze').removeAttribute('aria-busy');
  }
  if ($('ai-text')) $('ai-text').textContent = message;
  setStatus('ready', message);
  showToast(message);
}

/* ─── Main analysis pipeline ────────────────────────────────────────────── */
async function runAnalysis() {
  try {
    await runAnalysisPipeline();
  } catch (error) {
    showAnalysisError('Analysis could not complete. Try a smaller artifact, clear the input, or reload the page.', error);
  }
}

async function runAnalysisPipeline() {
  const activeTab = document.querySelector('.itab.active')?.dataset.tab || 'paste';
  let input = '';
  if (activeTab === 'upload') input = fileContent;
  else if (activeTab === 'url') input = $('url-input').value.trim();
  else input = $('input-text').value.trim();

  if (!input) {
    const msg = 'Paste content, enter an IOC, or select a local file first.';
    setStatus('ready', msg);
    showToast(msg);
    return;
  }
  if (input.length > MAX_INPUT_CHARS) {
    const msg = 'Input is too large for browser safe analysis. Split the artifact or analyze locally in a dedicated lab.';
    setStatus('ready', msg);
    showToast(msg);
    return;
  }

  setStatus('analyzing', 'Running engines...');
  $('btn-analyze').disabled = true;
  $('btn-analyze').setAttribute('aria-busy', 'true');
  $('results-wrap').classList.remove('show');
  $('spinner').classList.add('show');
  $('score-panel').style.display = 'none';
  $('static-panel').style.display = 'none';

  // Hashing is local: SHA-1/256 via SubtleCrypto, MD5 via bundled RFC 1321 code.
  const [h256, h1] = await Promise.all([sha256(input), sha1(input)]);
  const md5hash = md5(input);

  // Demo mode is detected purely from the sample's marker line — never faked.
  const isDemo = input.includes('# ThreatRecon demo sample');

  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const builtInHits = YARA_RULES.filter(r => r.rx.test(input));
  const customHits = buildCustomRules().filter(r => r.rx.test(input));
  const allHits = builtInHits.concat(customHits);
  const entropy = shannonEntropy(input);
  const deobf = advancedDecode(input, extractEncodedBlobs(input));
  const strings = classifyStrings(input);
  const capabilities = computeCapabilities(behaviors, iocs, builtInHits);
  const peTriage = parsePE(input);
  const scriptFindings = analyzeScripts(input);
  const suspiciousCmds = suspiciousCommands(input);

  const scores = computeScore(behaviors, iocs, builtInHits, entropy, deobf.length, capabilities.length);
  const verdict = verdictFromScore(scores.total);
  const malwareType = computeMalwareType(behaviors, iocs, builtInHits, scores.total);
  const recommendations = computeRecommendations(capabilities, malwareType, behaviors, iocs);
  const confidence = analystConfidence(behaviors, iocs, builtInHits, capabilities);
  const category = likelyCategory(malwareType, capabilities, iocs, behaviors);
  const reGuidance = buildREGuidance({ peTriage, scriptFindings, capabilities, malwareType, iocs, behaviors });
  const huntingQueries = buildHuntingQueries(iocs, suspiciousCmds);

  // MITRE technique set
  const mitreSet = new Set();
  behaviors.forEach(b => b.tech && b.tech.split(',').forEach(t => mitreSet.add(t.trim())));
  if (iocs.ips.length || iocs.urls.length || iocs.domains.length) mitreSet.add('T1071');
  const mitreList = [...mitreSet].slice(0, 14);
  const stringsIntelligence = buildStringsIntelligence(input);
  const apiRisk = buildApiRisk(peTriage);
  const attackTable = buildAttackTable(behaviors, mitreList, MITRE_MAP);
  const timeline = buildAttackTimeline({ input, behaviors, peTriage, apiRisk });
  const draftYara = generateDraftYara({ iocs, category, apiRisk, stringsIntelligence, behaviors, isDemo });
  const draftSigma = generateDraftSigma(input, attackTable);
  const iocActionability = buildIOCActionability(iocs, isDemo, undefined, isLocalPrivateIp);
  const threatIntelPivotRows = buildThreatIntelPivotRows(iocActionability);
  const threatIntelPivots = flattenThreatIntelPivots(threatIntelPivotRows);
  const blocklist = blocklistItems(iocActionability);
  const exportNotes = actionableExportNotes(iocActionability, blocklist);
  const detectionEngineering = buildDetectionEngineering({ draftYara, draftSigma, huntingQueries, blocklist });

  // Reveal panels
  $('static-panel').style.display = 'block';
  $('score-panel').style.display = 'block';
  $('spinner').classList.remove('show');
  $('results-wrap').classList.add('show');

  // Render
  renderStatic(h256, h1, md5hash, input, entropy);
  renderScore(scores, verdict);
  renderIOC(iocs);
  renderBehaviors(behaviors);
  const entropyCat = renderEntropy(entropy);
  renderStrings(strings);
  renderStringsIntelligence(stringsIntelligence);
  renderPETriage(peTriage);
  renderApiRisk(apiRisk);
  renderScriptAnalysis(scriptFindings);
  renderYara(allHits);
  renderMitre(mitreList);
  renderAttackTable(attackTable);
  renderTimelineTable(timeline);
  renderCapabilities(capabilities, malwareType);
  renderRecommendations(recommendations);
  renderREGuidance(reGuidance);
  renderHuntingQueries(huntingQueries);
  renderGeneratedRule('draft-yara-body', draftYara, 'YARA');
  renderGeneratedRule('draft-sigma-body', draftSigma, 'Sigma');
  renderIOCActionability(iocActionability);
  renderDetectionEngineering(detectionEngineering);
  renderThreatIntelPivots(threatIntelPivotRows);
  updateDynamicContextualActions(iocs, behaviors, capabilities, malwareType);
  renderDeobf(deobf);

  // Analyst report (textContent only — never innerHTML)
  const report = generateAnalystReport({
    input, total: scores.total, verdict, behaviors, iocs, yaraHits: allHits,
    entropy, entropyCat, mitreList, h256, h1, md5hash, malwareType, capabilities,
    deobf, recommendations, isDemo, confidence, category, timeline, huntingQueries,
    reGuidance, peTriage, scriptFindings, exportNotes, scores, workflowMode,
    stringsIntelligence, apiRisk, attackTable, draftYara, draftSigma,
    iocActionability, detectionEngineering, threatIntelPivotRows,
  });
  typewrite($('ai-text'), report);

  lastReport = {
    timestamp: new Date().toISOString(),
    mode: analysisMode,
    workflowMode,
    demo: isDemo,
    demoNotice: isDemo ? DEMO_NOTICE : null,
    sha256: h256, sha1: h1, md5: md5hash, entropy,
    score: scores.total, scoreBreakdown: scores, verdict, malwareType,
    analystConfidence: confidence, likelyCategory: category,
    behaviors: behaviors.map(b => ({ sev: b.sev, label: b.label, tech: b.tech })),
    yaraHits: allHits.map(y => ({ name: y.name, desc: y.desc })),
    mitre: mitreList, capabilities: capabilities.map(c => c.class),
    iocs, deobfuscated: deobf.map(d => ({ type: d.type, decoded: d.decoded.slice(0, 400) })),
    peTriage, scriptFindings, stringsIntelligence, apiRisk, attackTable,
    behaviorTimeline: timeline, draftYara, draftSigma, detectionEngineering,
    iocActionability, huntingQueries, reGuidance,
    threatIntelPivots,
    threatIntelPivotRows,
    manualReputationPivots: threatIntelPivots.filter(p => p.url),
    blocklist,
    actionableExportNotes: exportNotes,
    iocCsvRows: iocRows(iocActionability), recommendations, report,
    dynamicAnalysisNextSteps: buildDynamicAnalysisNextSteps(),
  };

  applyModeVisibility();
  $('export-row').style.display = 'flex';
  setStatus('ready', 'Analysis complete');
  $('btn-analyze').disabled = false;
  $('btn-analyze').removeAttribute('aria-busy');
}

/* Cosmetic typewriter that only ever uses textContent (no HTML parsing). */
let typeTimer = null;
function typewrite(el, text) {
  if (typeTimer) clearInterval(typeTimer);
  el.textContent = '';
  let i = 0;
  typeTimer = setInterval(() => {
    el.textContent = text.slice(0, i);
    i += 24;
    if (i > text.length) { el.textContent = text; clearInterval(typeTimer); typeTimer = null; }
  }, 8);
}

/* ─── Clear / demo / IOC loader ─────────────────────────────────────────── */
function clearAll() {
  $('input-text').value = '';
  if ($('custom-yara')) $('custom-yara').value = '';
  fileContent = ''; fileName = '';
  $('file-loaded').style.display = 'none';
  $('file-blocked').style.display = 'none';
  $('url-input').value = '';
  $('file-input').value = '';
  $('results-wrap').classList.remove('show');
  $('score-panel').style.display = 'none';
  $('static-panel').style.display = 'none';
  $('score-bar').style.width = '0%';
  $('export-row').style.display = 'none';
  const dynCtx = $('dyn-context-actions');
  if (dynCtx) { dynCtx.style.display = 'none'; dynCtx.innerHTML = ''; }
  setStatus('ready', 'All engines ready');
}

function loadDemo() {
  switchInputTab('paste');
  fileContent = ''; fileName = '';
  $('file-loaded').style.display = 'none';
  $('input-text').value = DEMO_SAMPLE;
  showToast('Demo sample loaded');
}

function loadIOC() {
  const val = $('url-input').value.trim();
  if (!val) return;
  $('input-text').value = val;
  switchInputTab('paste');
  showToast('IOC moved to paste input');
}

/* ─── Exports (client-side blobs; nothing leaves the browser) ───────────── */
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportJSON() {
  if (!lastReport) return;
  download(`threatrecon-report-${Date.now()}.json`, JSON.stringify(lastReport, null, 2), 'application/json');
  showToast('JSON report downloaded');
}

function exportMarkdown() {
  if (!lastReport) return;
  const r = lastReport;
  const md = `# ThreatRecon Triage Report
${r.demo ? '\n> ' + DEMO_NOTICE + '\n' : ''}
**Date:** ${r.timestamp}
**Analysis mode:** ${r.mode}
**Workflow mode:** ${r.workflowMode}
**Score:** ${r.score}/100 — ${r.verdict}
**Analyst confidence:** ${r.analystConfidence}
**Likely malware category:** ${r.likelyCategory}
**Inferred type (heuristic):** ${r.malwareType}

## Hashes (calculated locally)
- MD5: \`${r.md5}\`
- SHA-1: \`${r.sha1}\`
- SHA-256: \`${r.sha256}\`
- Entropy: ${r.entropy.toFixed(3)} bits/byte

## Score Explanation
- Behavior score: ${r.scoreBreakdown.beh}
- IOC score: ${r.scoreBreakdown.iocScore}
- YARA score: ${r.scoreBreakdown.yaraScore}
- Entropy score: ${r.scoreBreakdown.entScore}
- Deobfuscation score: ${r.scoreBreakdown.deobfScore}
- Capability score: ${r.scoreBreakdown.capScore}

## Behavioral Indicators
${r.behaviors.map(b => `- [${b.sev}] ${b.label} | ${b.tech}`).join('\n') || '- none'}

## YARA-style local regex matches
${r.yaraHits.map(y => `- ${y.name}: ${y.desc}`).join('\n') || '- none'}

## MITRE ATT&CK
${r.mitre.join(', ') || 'none'}

## MITRE ATT&CK Table
${r.attackTable.map(x => `- **${x.tactic}** | ${x.techniqueId} ${x.techniqueName} | Evidence: ${x.observedEvidence} | Confidence: ${x.confidence} | Detection: ${x.detectionIdea}`).join('\n') || '- none'}

## Capabilities
${r.capabilities.map(c => `- ${c}`).join('\n') || '- none'}

## Static PE Triage
${[
  `- Type guess: ${r.peTriage.fileType}`,
  `- DOS header: ${r.peTriage.hasMZ}`,
  `- PE signature: ${r.peTriage.hasPE}`,
  `- Architecture: ${r.peTriage.architecture}`,
  `- Timestamp: ${r.peTriage.timestamp || 'not available'}`,
  `- Subsystem: ${r.peTriage.subsystem || 'not available'}`,
  `- Image base: ${r.peTriage.imageBase || 'not available'}`,
  `- Entry point RVA: ${r.peTriage.entryPointRva || 'not available'}`,
  `- Imports: ${(r.peTriage.imports || []).join(', ') || 'none parsed'}`,
  `- Exports: ${(r.peTriage.exports || []).join(', ') || 'none parsed'}`,
  `- Suspicious API strings: ${(r.peTriage.suspiciousApiStrings || []).join(', ') || 'none'}`,
  `- Packed indicators: ${r.peTriage.packedIndicators.join('; ') || 'none'}`,
].join('\n')}

## API Risk Table
${r.apiRisk.map(a => `- ${a.api} | ${a.category} | ${a.risk} | ${a.detectedAs} | ${a.why}`).join('\n') || '- none'}

## Script Analysis
${r.scriptFindings.map(s => `- ${s.family}: ${s.hits.join(', ')}`).join('\n') || '- none'}

## IOCs
${Object.entries(r.iocs).filter(([, v]) => v.length).map(([k, v]) => `### ${k}\n${v.join('\n')}`).join('\n\n') || 'none'}
${r.actionableExportNotes.length ? `\n### Actionable export notes\n${r.actionableExportNotes.map(n => `- ${n}`).join('\n')}` : ''}

## IOC Actionability
${r.iocActionability.map(x => `- ${x.type}: ${x.value} | actionable=${x.actionable ? 'yes' : 'no'} | ${x.reason}`).join('\n') || '- none'}

## Threat Intel Pivots
Manual analyst pivots. ${THREAT_INTEL_PIVOT_PRIVACY_NOTE}

${formatThreatIntelPivotsMarkdown(r.threatIntelPivotRows || [])}

## Strings Intelligence
${r.stringsIntelligence.map(c => `- ${c.name} (${c.confidence}): ${c.items.slice(0, 6).join('; ')}`).join('\n') || '- none'}

## Deobfuscated Content
${r.deobfuscated.map(d => `- [${d.type}] ${d.decoded}`).join('\n') || '- none'}

## Behavior Timeline
${r.behaviorTimeline.map(x => `- ${x.stage}: ${x.evidence.join('; ')} | ${x.confidence}${x.technique ? ` | ${x.technique}` : ''} | Validate: ${x.validation}`).join('\n') || '- none'}

## Draft YARA Rule
\`\`\`yara
${r.draftYara}
\`\`\`

## Draft Sigma Rule
\`\`\`yaml
${r.draftSigma}
\`\`\`

## Detection Engineering Output
### Splunk
${r.detectionEngineering.splunk.map(x => `- \`${x}\``).join('\n') || '- none'}

### Defender KQL
${r.detectionEngineering.defender.map(x => `\`\`\`kql\n${x}\n\`\`\``).join('\n') || '- none'}

### Elastic
${r.detectionEngineering.elastic.map(x => `- \`${x}\``).join('\n') || '- none'}

## Recommended Containment
${r.recommendations.map(x => `- ${x}`).join('\n')}

## Recommended Hunting Queries
${r.huntingQueries.slice(0, 8).map(q => `- ${q.value}\n  - Splunk: \`${q.splunk}\`\n  - Defender KQL: \`${q.defender.replace(/\n/g, ' ')}\`\n  - Elastic: \`${q.elastic}\``).join('\n') || '- none'}

## Reverse Engineering Guidance
${r.reGuidance.map(x => `- ${x}`).join('\n') || '- none'}

${formatDynamicAnalysisMarkdown()}

---
*Generated locally by ThreatRecon Malware Triage Workbench — static analysis only, no sample upload, no API calls.*`;
  download(`threatrecon-report-${Date.now()}.md`, md, 'text/markdown');
  showToast('Markdown report downloaded');
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportIOCCSV() {
  if (!lastReport) return;
  const header = ['type', 'value', 'source', 'confidence', 'notes'];
  const noteRows = (lastReport.actionableExportNotes || []).map(n => ({
    type: 'note',
    value: n,
    source: 'ThreatRecon export policy',
    confidence: 'informational',
    notes: n,
  }));
  const rows = [header.join(',')].concat(noteRows.concat(lastReport.iocCsvRows).map(r =>
    [r.type, r.value, r.source, r.confidence, r.notes].map(csvEscape).join(',')
  ));
  download(`threatrecon-iocs-${Date.now()}.csv`, rows.join('\n'), 'text/csv');
  showToast('IOC CSV downloaded');
}

function exportBlocklist() {
  if (!lastReport) return;
  const notes = lastReport.actionableExportNotes || [];
  const entries = lastReport.blocklist || [];
  const entryLines = entries.length ? entries : [
    '# No actionable IOCs found.',
    '# Extracted indicators were local, reserved, documentation, demo, or analyst-validation-only.',
  ];
  const plain = [
    '# ThreatRecon blocklist export',
    '# Actionable public IPs, domains, URLs, and hashes only',
    '# Local/private, reserved documentation, demo/test, and known public resolver indicators are excluded.',
    ...notes.map(n => `# ${n}`),
    ...entryLines,
  ].join('\n');
  const csvRows = entries.length ? entries.map(v => {
    const type = /^[0-9a-f]{32}$/i.test(v) ? 'hash_md5'
      : /^[0-9a-f]{40}$/i.test(v) ? 'hash_sha1'
        : /^[0-9a-f]{64}$/i.test(v) ? 'hash_sha256'
          : /^https?:\/\//i.test(v) ? 'url'
            : /^\d{1,3}(\.\d{1,3}){3}$/.test(v) ? 'ip' : 'domain';
    return [type, v].map(csvEscape).join(',');
  }) : ['note,no actionable IOCs found'];
  const csv = ['type,value'].concat(csvRows).join('\n');
  download(`threatrecon-blocklist-${Date.now()}.txt`, plain + '\n\n# CSV\n' + csv + '\n', 'text/plain');
  showToast('Blocklist downloaded');
}

function exportYARA() {
  if (!lastReport) return;
  download(`threatrecon-draft-yara-${Date.now()}.yar`, lastReport.draftYara || '// No draft YARA generated.\n', 'text/plain');
  showToast('Draft YARA downloaded');
}

function exportSigma() {
  if (!lastReport) return;
  download(`threatrecon-draft-sigma-${Date.now()}.yml`, lastReport.draftSigma || '# No draft Sigma generated.\n', 'text/yaml');
  showToast('Draft Sigma downloaded');
}

function copyIOCs() {
  if (!lastReport) return;
  const text = Object.entries(lastReport.iocs).filter(([, v]) => v.length).map(([k, v]) => `# ${k}\n${v.join('\n')}`).join('\n\n');
  navigator.clipboard.writeText(text || 'No IOCs extracted.').then(() => showToast('IOCs copied to clipboard'));
}

function copyReport() {
  if (!lastReport) return;
  navigator.clipboard.writeText(lastReport.report).then(() => showToast('Report copied to clipboard'));
}

function runComparison() {
  const a = $('compare-a')?.value || '';
  const b = $('compare-b')?.value || '';
  if (!a.trim() || !b.trim()) { showToast('Paste two samples to compare'); return; }
  if (a.length > MAX_INPUT_CHARS || b.length > MAX_INPUT_CHARS) {
    showToast('Comparison input is too large for browser safe analysis.');
    return;
  }
  lastComparison = compareSamples(a, b, BEHAVIOR_RULES, YARA_RULES);
  renderComparison(lastComparison);
  showToast('Samples compared locally');
}

function exportComparisonJSON() {
  if (!lastComparison) return;
  download(`threatrecon-comparison-${Date.now()}.json`, JSON.stringify(lastComparison, null, 2), 'application/json');
  showToast('Comparison JSON downloaded');
}

function exportComparisonMarkdown() {
  if (!lastComparison) return;
  const c = lastComparison;
  const md = `# ThreatRecon Sample Comparison

**Similarity:** ${c.similarityScore}/100
**Possible relation:** ${c.possibleRelation}

${c.reasoning}

## Shared IOCs
${Object.entries(c.sharedIocs).filter(([, v]) => v.length).map(([k, v]) => `### ${k}\n${v.join('\n')}`).join('\n\n') || 'none'}

## Shared Strings
${c.sharedStrings.map(x => `- ${x}`).join('\n') || '- none'}

## Shared Behaviors
${c.sharedBehaviors.map(x => `- ${x}`).join('\n') || '- none'}

## Shared YARA-style Hits
${c.sharedYara.map(x => `- ${x}`).join('\n') || '- none'}

## Shared MITRE Techniques
${c.sharedMitre.map(x => `- ${x}`).join('\n') || '- none'}

*Generated locally. No upload, no API calls, no execution.*`;
  download(`threatrecon-comparison-${Date.now()}.md`, md, 'text/markdown');
  showToast('Comparison Markdown downloaded');
}

/* ─── Static content renderers (KB / Tools / Cheat sheet / Sandboxes) ───── */
function renderKB(filter) {
  const data = filter === 'all' ? KB_DATA : KB_DATA.filter(d => d.type === filter);
  $('kb-grid').innerHTML = data.map(d => `
    <div class="kb-card" data-type="${escapeHtml(d.type)}">
      <div class="kb-card-head">
        <span class="kb-name">${escapeHtml(d.name)}</span>
        <span class="kb-type type-${escapeHtml(d.type)}">${escapeHtml(d.type)}</span>
      </div>
      <div class="kb-card-body">${escapeHtml(d.desc)}
        <div class="kb-meta">
          ${d.active ? '<span class="kb-chip active-chip">\u26A1 Tracked</span>' : ''}
          ${d.chips.map(c => `<span class="kb-chip">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
}

function renderTools() {
  $('tools-grid').innerHTML = TOOLS_DATA.map(t => `
    <div class="tool-card">
      <div class="tool-name">${escapeHtml(t.name)}</div>
      <div class="tool-cat">${escapeHtml(t.cat)}</div>
      <div class="tool-desc">${escapeHtml(t.desc)}</div>
      <div class="tool-use">$ ${escapeHtml(t.use)}</div>
      ${t.free ? '<span class="tool-free">FREE / OPEN SOURCE</span>' : ''}
    </div>`).join('');
}

function renderCheatSheet() {
  $('cs-grid').innerHTML = CS_DATA.map(s => `
    <div class="cs-card">
      <div class="cs-head">${escapeHtml(s.head)}</div>
      <div class="cs-body">
        ${s.items.map(i => `<div class="cs-item"><span class="cs-cmd">${escapeHtml(i.cmd)}</span><span class="cs-note">${escapeHtml(i.note)}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

function renderSandboxes() {
  const categories = [...new Set(SB_DATA.map(s => s.category))];
  $('sb-grid').innerHTML = categories.map(cat => {
    const items = SB_DATA.filter(s => s.category === cat);
    return `<section class="sb-category">
      <h3 class="sb-category-title">${escapeHtml(cat)}</h3>
      <div class="sb-category-grid">
        ${items.map(s => `
          <div class="sb-card">
            <div class="sb-card-top">
              <div class="sb-name">${escapeHtml(s.name)}</div>
              <span class="sb-cat-badge">${escapeHtml(s.category)}</span>
            </div>
            <div class="sb-meta-row"><span class="sb-meta-key">Best for</span><span class="sb-meta-val">${escapeHtml(s.bestFor)}</span></div>
            <div class="sb-meta-row"><span class="sb-meta-key">Use when</span><span class="sb-meta-val">${escapeHtml(s.useWhen)}</span></div>
            <div class="sb-desc">${escapeHtml(s.desc)}</div>
            <div class="sb-caution">${escapeHtml(s.caution)}</div>
            <div class="sb-tags">${s.tags.map(t => `<span class="sb-tag">${escapeHtml(t)}</span>`).join('')}</div>
            <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="sb-open-btn">Open ${escapeHtml(s.name)} <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
          </div>`).join('')}
      </div>
    </section>`;
  }).join('');
}

/* ─── Event wiring (replaces every inline on* handler) ──────────────────── */
function wire() {
  if (!$('threatrecon-client-shell') && !$('tr-root')) return;

  // Navigation tabs + any element with data-nav (CTAs, footer links)
  document.querySelectorAll('.nav-tab[data-page]').forEach(t =>
    t.addEventListener('click', (e) => { e.preventDefault(); showPage(t.dataset.page); }));
  document.querySelectorAll('[data-nav]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); showPage(el.dataset.nav); }));

  // Hero CTA: load demo then run
  const demoCta = $('cta-demo');
  if (demoCta) demoCta.addEventListener('click', (e) => { e.preventDefault(); showPage('analyzer'); loadDemo(); runAnalysis(); });

  // Input tabs
  document.querySelectorAll('.itab').forEach(t =>
    t.addEventListener('click', () => switchInputTab(t.dataset.tab)));

  // Analysis mode buttons
  document.querySelectorAll('.mode-btn').forEach(b =>
    b.addEventListener('click', () => setMode(b.dataset.mode)));

  const btnAnalyze = $('btn-analyze');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', runAnalysis);
    $('btn-clear').addEventListener('click', clearAll);
    $('btn-demo').addEventListener('click', loadDemo);
    $('btn-loadioc').addEventListener('click', loadIOC);
    $('exp-json').addEventListener('click', exportJSON);
    $('exp-md').addEventListener('click', exportMarkdown);
    $('exp-ioc-csv').addEventListener('click', exportIOCCSV);
    $('exp-blocklist').addEventListener('click', exportBlocklist);
    $('exp-yara').addEventListener('click', exportYARA);
    if ($('exp-sigma')) $('exp-sigma').addEventListener('click', exportSigma);
    $('exp-copyioc').addEventListener('click', copyIOCs);
    $('exp-copyreport').addEventListener('click', copyReport);
  }
  if ($('btn-compare')) $('btn-compare').addEventListener('click', runComparison);
  document.querySelectorAll('.workflow-btn').forEach(b =>
    b.addEventListener('click', () => setWorkflowMode(b.dataset.workflow)));

  // File upload + drag/drop (File Safety Gate)
  const fileInput = $('file-input');
  const dz = $('drop-zone');
  if (fileInput && dz) {
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dz.addEventListener('click', () => fileInput.click());
    dz.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
  }

  // Dynamic analysis contextual handoff (scroll only — no external auto-submit)
  document.body.addEventListener('click', (e) => {
    const handoff = e.target.closest('.dyn-scroll-handoff');
    if (handoff) {
      e.preventDefault();
      scrollToDynamicHandoff();
      return;
    }
    const copyBtn = e.target.closest('.copy-generated');
    if (copyBtn) {
      e.preventDefault();
      const target = $(copyBtn.dataset.copyTarget);
      const text = target ? target.textContent : '';
      navigator.clipboard.writeText(text || '').then(() => showToast('Copied to clipboard'));
      return;
    }
    const sb = e.target.closest('.dyn-scroll-sandbox');
    if (sb) {
      e.preventDefault();
      showPage('sandboxes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // KB filters
  document.querySelectorAll('.kb-filter').forEach(f =>
    f.addEventListener('click', () => {
      document.querySelectorAll('.kb-filter').forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      renderKB(f.dataset.filter);
    }));

  if ($('kb-grid')) {
    renderKB('all');
    renderTools();
    renderCheatSheet();
    renderSandboxes();
    setMode('deep');
    setWorkflowMode('SOC Triage');
    renderComparison(null);
  }

  // Tasteful console easter egg (no secrets, no endpoints).
  console.log('%cThreatRecon', 'color:#00d4ff;font-size:20px;font-weight:bold;');
  console.log('Signal found. Static analysis only. No cloud calls. No detonation.');
}

function bootThreatRecon() {
  if (window.__THREATRECON_BOOTED__) return;
  window.__THREATRECON_BOOTED__ = true;
  wire();
}

window.bootThreatRecon = bootThreatRecon;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootThreatRecon);
} else {
  bootThreatRecon();
}
