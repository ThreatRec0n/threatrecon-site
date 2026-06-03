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
} from './utils.js';
import {
  BEHAVIOR_RULES, YARA_RULES, MITRE_MAP, DEMO_SAMPLE,
  KB_DATA, TOOLS_DATA, CS_DATA, SB_DATA,
} from './rules.js';

const $ = (id) => document.getElementById(id);

/* ─── Mutable UI state ──────────────────────────────────────────────────── */
let fileContent = '';
let fileName = '';
let lastReport = null;
let analysisMode = 'deep'; // deep | quick | ioc | deobf

/* Upload allow / block lists for the File Safety Gate. */
const ALLOWED_EXT = ['txt', 'log', 'ps1', 'bat', 'cmd', 'sh', 'py', 'js', 'vbs', 'php', 'rb', 'pl', 'conf', 'json', 'xml', 'ini', 'csv', 'yar'];
const BLOCKED_EXT = ['exe', 'dll', 'bin', 'com', 'msi', 'sys', 'scr', 'jar', 'iso', 'img', 'docm', 'xlsm', 'zip', '7z', 'rar'];
const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB default

/* Which result sections are shown for each analysis mode. */
const MODE_SECTIONS = {
  deep: null, // null = show everything
  quick: new Set(['static', 'score', 'ioc', 'behavior', 'yara', 'mitre', 'entropy', 'capabilities', 'recommendations', 'report']),
  ioc: new Set(['static', 'score', 'ioc']),
  deobf: new Set(['static', 'score', 'deobf', 'strings', 'entropy']),
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
    showToast('Upload blocked');
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
    fileContent = String(ev.target.result || '');
    fileName = file.name;
    loadedEl.style.display = 'block';
    // textContent — never innerHTML — so a crafted file name cannot inject markup.
    loadedEl.textContent = `\u2713 Loaded (local): ${fileName} \u2014 ${fileContent.length.toLocaleString()} bytes. Not uploaded anywhere.`;
  };
  reader.readAsText(file); // read as TEXT only; the file is never executed.
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
  if (iocs.ips.length || iocs.domains.length || iocs.onion.length) rec.push('Block extracted IPs, domains, and onion addresses at the firewall and DNS layer to cut C2/exfiltration.');
  if (caps.some(c => c.class === 'Credential Access') || /Harvester/.test(malwareType)) {
    rec.push('Assume credentials on affected hosts are compromised; force password resets and revoke active sessions.');
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

/* ─── Structured analyst report (local, no API) ─────────────────────────── */
function generateAnalystReport(ctx) {
  const { input, total, verdict, behaviors, iocs, yaraHits, entropy, entropyCat,
    mitreList, h256, malwareType, capabilities, deobf } = ctx;
  const criticals = behaviors.filter(b => b.sev === 'CRITICAL');
  const highs = behaviors.filter(b => b.sev === 'HIGH');
  const meds = behaviors.filter(b => b.sev === 'MED');
  const iocTotal = Object.values(iocs).flat().length;
  const confidence = criticals.length >= 2 ? 'high' : (criticals.length === 1 || highs.length >= 3) ? 'medium-high' : highs.length > 0 ? 'medium' : 'low';
  const sections = [];

  sections.push('EXECUTIVE SUMMARY');
  sections.push(`Composite threat score: ${total}/100 — assessed as ${verdict} with ${confidence} confidence. ` +
    `The sample triggered ${behaviors.length} behavioral indicator(s) (${criticals.length} CRITICAL, ${highs.length} HIGH, ${meds.length} MEDIUM), ` +
    `${yaraHits.length} YARA-style match(es), and ${iocTotal} extracted IOC(s). This assessment is based on static analysis performed entirely in the browser.`);

  sections.push('\nTECHNICAL FINDINGS');
  if (criticals.length) sections.push('Critical: ' + criticals.map(b => b.label).join('; ') + '.');
  if (highs.length) sections.push('High: ' + highs.slice(0, 6).map(b => b.label).join('; ') + '.');
  if (meds.length) sections.push('Medium: ' + meds.slice(0, 6).map(b => b.label).join('; ') + '.');
  sections.push(`Shannon entropy is ${entropy.toFixed(3)} bits/byte (${entropyCat.toLowerCase()}), ` +
    (entropy >= 7.2 ? 'consistent with a packed/encrypted payload that should be unpacked before deeper analysis.'
      : entropy >= 6.5 ? 'suggesting obfuscation or compression layers.'
        : 'consistent with readable plain-text/script content.'));

  sections.push('\nMALWARE TYPE');
  sections.push(`Inferred classification: ${malwareType}.`);

  sections.push('\nCAPABILITY SUMMARY');
  sections.push(capabilities.length ? capabilities.map(c => `- ${c.class}: ${c.desc}`).join('\n') : 'No distinct capabilities identified.');

  sections.push('\nATT&CK MAPPING');
  sections.push(mitreList.length ? mitreList.map(t => MITRE_MAP[t] || t).join('\n') : 'No techniques mapped.');

  sections.push('\nINDICATORS OF COMPROMISE');
  const iocLines = Object.entries(iocs).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join(', ')}`);
  sections.push(iocLines.length ? iocLines.join('\n') : 'No IOCs extracted.');

  sections.push('\nDEOBFUSCATED CONTENT');
  sections.push(deobf.length ? deobf.map(d => `[${d.type}] ${d.decoded.slice(0, 160)}`).join('\n') : 'No encoded/obfuscated blobs decoded.');

  sections.push('\nRECOMMENDED RESPONSE ACTIONS');
  sections.push(ctx.recommendations.map(r => `- ${r}`).join('\n'));

  sections.push('\nLIMITATIONS');
  sections.push('This report was generated by local, static, signature-based heuristics with no code execution and no external API calls. ' +
    'It cannot observe runtime behavior, decrypt packed payloads, resolve dynamically built strings, or attribute threat actors with confidence. ' +
    'Confirm findings by detonating the sample in a dedicated dynamic sandbox and correlating IOCs through reputable threat-intelligence sources. ' +
    `SHA-256 for pivoting: ${h256}.`);

  return sections.join('\n');
}

/* ─── Renderers (all untrusted values escaped) ──────────────────────────── */
function renderStatic(h256, h1, md5sim, input, entropy) {
  const links = [
    ['VT', `https://www.virustotal.com/gui/search/${encodeURIComponent(h256)}`, 'Search SHA-256 on VirusTotal'],
    ['Bazaar', `https://bazaar.abuse.ch/browse.php?search=sha256%3A${encodeURIComponent(h256)}`, 'Search hash on MalwareBazaar'],
    ['OTX', `https://otx.alienvault.com/indicator/file/${encodeURIComponent(h256)}`, 'AlienVault OTX'],
    ['ThreatFox', `https://threatfox.abuse.ch/browse/`, 'ThreatFox'],
  ];
  let html = `
    <div class="meta-row"><span class="meta-key">MD5*</span><span class="meta-val hash">${escapeHtml(md5sim)}</span></div>
    <div class="meta-row"><span class="meta-key">SHA-1</span><span class="meta-val hash">${escapeHtml(h1)}</span></div>
    <div class="meta-row"><span class="meta-key">SHA-256</span><span class="meta-val hash">${escapeHtml(h256)}</span></div>
    <div class="meta-row"><span class="meta-key">Size</span><span class="meta-val">${input.length.toLocaleString()} bytes</span></div>
    <div class="meta-row"><span class="meta-key">Lines</span><span class="meta-val">${input.split('\n').length.toLocaleString()}</span></div>
    ${fileName ? `<div class="meta-row"><span class="meta-key">File</span><span class="meta-val">${escapeHtml(fileName)}</span></div>` : ''}
    <div class="meta-row"><span class="meta-key">Entropy</span><span class="meta-val">${entropy.toFixed(3)} bits/byte</span></div>`;
  links.forEach(([k, url, label]) => {
    html += `<div class="meta-row"><span class="meta-key">${escapeHtml(k)}</span><span class="meta-val"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} \u2197</a></span></div>`;
  });
  html += `<div class="meta-row"><span class="meta-val" style="font-size:9px;color:var(--text3)">*MD5 column is a truncated SHA-1 surrogate (browser SubtleCrypto has no MD5). Use the SHA-256 for real pivots.</span></div>`;
  $('static-body').innerHTML = html;
}

function renderIOC(iocs) {
  const defs = [
    { key: 'ips', label: 'IP Addresses', cls: 'ip', link: v => `https://www.shodan.io/host/${encodeURIComponent(v)}` },
    { key: 'urls', label: 'URLs', cls: '', link: v => `https://urlscan.io/search/#${encodeURIComponent(v)}` },
    { key: 'domains', label: 'Domains', cls: 'domain', link: v => `https://urlscan.io/search/#${encodeURIComponent(v)}` },
    { key: 'onion', label: 'Onion Addresses', cls: 'domain', link: null },
    { key: 'md5', label: 'MD5 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'sha1', label: 'SHA-1 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'sha256', label: 'SHA-256 Hashes', cls: 'hash', link: v => `https://www.virustotal.com/gui/search/${encodeURIComponent(v)}` },
    { key: 'emails', label: 'Email Addresses', cls: '', link: null },
    { key: 'registry', label: 'Registry Keys', cls: 'reg', link: null },
    { key: 'paths', label: 'File Paths', cls: 'path', link: null },
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
    : strings.map(s => `<div class="string-item"><span class="str-type ${s.type}">${escapeHtml(s.type.toUpperCase())}</span><span class="str-val">${escapeHtml(s.val)}</span></div>`).join('');
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
  const [cls, text, color] = map[verdict];
  $('score-num').style.color = color;
  $('score-bar').style.background = color;
  setTimeout(() => { $('score-bar').style.width = total + '%'; }, 80);
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

/* ─── Main analysis pipeline ────────────────────────────────────────────── */
async function runAnalysis() {
  const activeTab = document.querySelector('.itab.active')?.dataset.tab || 'paste';
  let input = '';
  if (activeTab === 'upload') input = fileContent;
  else if (activeTab === 'url') input = $('url-input').value.trim();
  else input = $('input-text').value.trim();

  if (!input) { showToast('Paste content or upload a file first.'); return; }

  setStatus('analyzing', 'Running engines...');
  $('btn-analyze').disabled = true;
  $('results-wrap').classList.remove('show');
  $('spinner').classList.add('show');
  $('score-panel').style.display = 'none';
  $('static-panel').style.display = 'none';

  // Hashing is async; everything else is synchronous, local computation.
  const [h256, h1] = await Promise.all([sha256(input), sha1(input)]);
  const md5sim = h1.slice(0, 32);

  const iocs = extractIOCs(input);
  const behaviors = BEHAVIOR_RULES.filter(r => r.rx.test(input));
  const builtInHits = YARA_RULES.filter(r => r.rx.test(input));
  const customHits = buildCustomRules().filter(r => r.rx.test(input));
  const allHits = builtInHits.concat(customHits);
  const entropy = shannonEntropy(input);
  const deobf = extractEncodedBlobs(input);
  const strings = classifyStrings(input);
  const capabilities = computeCapabilities(behaviors, iocs, builtInHits);

  const scores = computeScore(behaviors, iocs, builtInHits, entropy, deobf.length, capabilities.length);
  const verdict = verdictFromScore(scores.total);
  const malwareType = computeMalwareType(behaviors, iocs, builtInHits, scores.total);
  const recommendations = computeRecommendations(capabilities, malwareType, behaviors, iocs);

  // MITRE technique set
  const mitreSet = new Set();
  behaviors.forEach(b => b.tech && b.tech.split(',').forEach(t => mitreSet.add(t.trim())));
  if (iocs.ips.length || iocs.urls.length || iocs.domains.length) mitreSet.add('T1071');
  const mitreList = [...mitreSet].slice(0, 14);

  // Reveal panels
  $('static-panel').style.display = 'block';
  $('score-panel').style.display = 'block';
  $('spinner').classList.remove('show');
  $('results-wrap').classList.add('show');

  // Render
  renderStatic(h256, h1, md5sim, input, entropy);
  renderScore(scores, verdict);
  renderIOC(iocs);
  renderBehaviors(behaviors);
  const entropyCat = renderEntropy(entropy);
  renderStrings(strings);
  renderYara(allHits);
  renderMitre(mitreList);
  renderCapabilities(capabilities, malwareType);
  renderRecommendations(recommendations);
  renderDeobf(deobf);

  // Analyst report (textContent only — never innerHTML)
  const report = generateAnalystReport({
    input, total: scores.total, verdict, behaviors, iocs, yaraHits: allHits,
    entropy, entropyCat, mitreList, h256, malwareType, capabilities, deobf, recommendations,
  });
  typewrite($('ai-text'), report);

  lastReport = {
    timestamp: new Date().toISOString(),
    mode: analysisMode,
    sha256: h256, sha1: h1, md5sim, entropy,
    score: scores.total, scoreBreakdown: scores, verdict, malwareType,
    behaviors: behaviors.map(b => ({ sev: b.sev, label: b.label, tech: b.tech })),
    yaraHits: allHits.map(y => ({ name: y.name, desc: y.desc })),
    mitre: mitreList, capabilities: capabilities.map(c => c.class),
    iocs, deobfuscated: deobf.map(d => ({ type: d.type, decoded: d.decoded.slice(0, 400) })),
    recommendations, report,
  };

  applyModeVisibility();
  $('export-row').style.display = 'flex';
  setStatus('ready', 'Analysis complete');
  $('btn-analyze').disabled = false;
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

**Date:** ${r.timestamp}
**Analysis mode:** ${r.mode}
**Score:** ${r.score}/100 — ${r.verdict}
**Inferred type:** ${r.malwareType}

## Hashes
- SHA-256: \`${r.sha256}\`
- SHA-1: \`${r.sha1}\`
- MD5 surrogate: \`${r.md5sim}\`
- Entropy: ${r.entropy.toFixed(3)} bits/byte

## Behavioral Indicators
${r.behaviors.map(b => `- [${b.sev}] ${b.label} | ${b.tech}`).join('\n') || '- none'}

## YARA-style Matches
${r.yaraHits.map(y => `- ${y.name}: ${y.desc}`).join('\n') || '- none'}

## MITRE ATT&CK
${r.mitre.join(', ') || 'none'}

## Capabilities
${r.capabilities.map(c => `- ${c}`).join('\n') || '- none'}

## IOCs
${Object.entries(r.iocs).filter(([, v]) => v.length).map(([k, v]) => `### ${k}\n${v.join('\n')}`).join('\n\n') || 'none'}

## Deobfuscated Content
${r.deobfuscated.map(d => `- [${d.type}] ${d.decoded}`).join('\n') || '- none'}

## Recommended Response Actions
${r.recommendations.map(x => `- ${x}`).join('\n')}

---
*Generated locally by ThreatRecon Malware Triage Workbench — static analysis only, no sample upload, no API calls.*`;
  download(`threatrecon-report-${Date.now()}.md`, md, 'text/markdown');
  showToast('Markdown report downloaded');
}

function exportYARA() {
  if (!lastReport) return;
  const rules = lastReport.yaraHits.map(y =>
    `rule ${y.name.replace(/[^A-Za-z0-9_]/g, '_')} {\n  meta:\n    description = ${JSON.stringify(y.desc)}\n    source = "ThreatRecon Workbench"\n    date = "${lastReport.timestamp.slice(0, 10)}"\n  strings:\n    // Add concrete strings/bytes from your sample here.\n  condition:\n    any of them\n}\n`).join('\n');
  download(`threatrecon-rules-${Date.now()}.yar`, rules || '// No YARA-style rules triggered.\n', 'text/plain');
  showToast('YARA-style rules downloaded');
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
  $('sb-grid').innerHTML = SB_DATA.map(s => `
    <div class="sb-card">
      <div class="sb-name">${escapeHtml(s.name)}</div>
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="sb-url">${escapeHtml(s.url)}</a>
      <div class="sb-desc">${escapeHtml(s.desc)}</div>
      <div class="sb-tags">${s.tags.map(t => `<span class="sb-tag">${escapeHtml(t)}</span>`).join('')}</div>
    </div>`).join('');
}

/* ─── Event wiring (replaces every inline on* handler) ──────────────────── */
function wire() {
  // Navigation tabs + any element with data-nav (CTAs, footer links)
  document.querySelectorAll('.nav-tab[data-page]').forEach(t =>
    t.addEventListener('click', () => showPage(t.dataset.page)));
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

  // Core actions
  $('btn-analyze').addEventListener('click', runAnalysis);
  $('btn-clear').addEventListener('click', clearAll);
  $('btn-demo').addEventListener('click', loadDemo);
  $('btn-loadioc').addEventListener('click', loadIOC);

  // Exports
  $('exp-json').addEventListener('click', exportJSON);
  $('exp-md').addEventListener('click', exportMarkdown);
  $('exp-yara').addEventListener('click', exportYARA);
  $('exp-copyioc').addEventListener('click', copyIOCs);
  $('exp-copyreport').addEventListener('click', copyReport);

  // File upload + drag/drop (File Safety Gate)
  const fileInput = $('file-input');
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  $('drop-zone').addEventListener('click', () => fileInput.click());
  const dz = $('drop-zone');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

  // KB filters
  document.querySelectorAll('.kb-filter').forEach(f =>
    f.addEventListener('click', () => {
      document.querySelectorAll('.kb-filter').forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      renderKB(f.dataset.filter);
    }));

  // Initial render of static content
  renderKB('all');
  renderTools();
  renderCheatSheet();
  renderSandboxes();
  setMode('deep');

  // Tasteful console easter egg (no secrets, no endpoints).
  console.log('%cThreatRecon', 'color:#00d4ff;font-size:20px;font-weight:bold;');
  console.log('Signal found. Static analysis only. No cloud calls. No detonation.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
