import { extractIOCs, shannonEntropy, rot13 } from './utils.js';

const MAX_STRINGS = 500;
const MAX_DECODED = 30;
const MAX_RULE_STRINGS = 14;

export const API_RISK_DEFINITIONS = [
  { api: 'VirtualAllocEx', category: 'Process injection', risk: 'High', why: 'Allocates memory inside another process, often before code injection.' },
  { api: 'WriteProcessMemory', category: 'Process injection', risk: 'High', why: 'Writes bytes into another process, commonly paired with remote thread creation.' },
  { api: 'CreateRemoteThread', category: 'Process injection', risk: 'High', why: 'Starts execution in a remote process.' },
  { api: 'OpenProcess', category: 'Process injection', risk: 'Medium', why: 'Opens handles to other processes; risk increases with injection or LSASS context.' },
  { api: 'QueueUserAPC', category: 'Process injection', risk: 'High', why: 'Can schedule code execution in another thread.' },
  { api: 'NtCreateThreadEx', category: 'Process injection', risk: 'High', why: 'Native API often used for stealthier remote thread creation.' },
  { api: 'VirtualAlloc', category: 'Memory allocation', risk: 'Medium', why: 'Allocates executable memory for unpacking, shellcode, or loaders.' },
  { api: 'LoadLibraryA', category: 'Dynamic loading', risk: 'Medium', why: 'Loads libraries dynamically at runtime.' },
  { api: 'LoadLibraryW', category: 'Dynamic loading', risk: 'Medium', why: 'Loads libraries dynamically at runtime.' },
  { api: 'GetProcAddress', category: 'Dynamic loading', risk: 'Medium', why: 'Resolves APIs dynamically, often to hide imports.' },
  { api: 'InternetOpen', category: 'Network', risk: 'Medium', why: 'Initializes WinINet network access.' },
  { api: 'InternetOpenUrl', category: 'Network', risk: 'High', why: 'Fetches remote resources over WinINet.' },
  { api: 'WinHttpOpen', category: 'Network', risk: 'Medium', why: 'Initializes WinHTTP network access.' },
  { api: 'URLDownloadToFile', category: 'Network', risk: 'High', why: 'Downloads a remote file to disk.' },
  { api: 'WSAStartup', category: 'Network', risk: 'Medium', why: 'Initializes Winsock for raw network communication.' },
  { api: 'connect', category: 'Network', risk: 'Medium', why: 'Creates outbound socket connections.' },
  { api: 'send', category: 'Network', risk: 'Medium', why: 'Sends data over sockets.' },
  { api: 'recv', category: 'Network', risk: 'Medium', why: 'Receives data over sockets.' },
  { api: 'RegSetValue', category: 'Persistence', risk: 'Medium', why: 'Writes registry values, often used for persistence.' },
  { api: 'RegCreateKey', category: 'Persistence', risk: 'Medium', why: 'Creates registry keys that may support persistence.' },
  { api: 'CreateService', category: 'Persistence', risk: 'High', why: 'Creates Windows services for persistence or privileged execution.' },
  { api: 'OpenSCManager', category: 'Persistence', risk: 'Medium', why: 'Accesses the Service Control Manager.' },
  { api: 'StartService', category: 'Persistence', risk: 'Medium', why: 'Starts a Windows service.' },
  { api: 'LsaOpenPolicy', category: 'Credential access', risk: 'High', why: 'Accesses LSA policy objects.' },
  { api: 'MiniDumpWriteDump', category: 'Credential access', risk: 'High', why: 'Can dump LSASS memory for credential theft.' },
  { api: 'CryptUnprotectData', category: 'Credential access', risk: 'High', why: 'Decrypts DPAPI-protected secrets such as browser credentials.' },
  { api: 'CryptEncrypt', category: 'Crypto', risk: 'Medium', why: 'Encrypts data; risk depends on surrounding ransomware or exfiltration context.' },
  { api: 'IsDebuggerPresent', category: 'Anti debug', risk: 'Medium', why: 'Checks whether the process is being debugged.' },
  { api: 'CheckRemoteDebuggerPresent', category: 'Anti debug', risk: 'Medium', why: 'Checks remote debugger state.' },
  { api: 'NtQueryInformationProcess', category: 'Anti debug', risk: 'Medium', why: 'Can query debug flags and process internals.' },
  { api: 'OutputDebugString', category: 'Anti debug', risk: 'Low', why: 'Sometimes used in anti-debug checks.' },
  { api: 'GetAsyncKeyState', category: 'Keylogging', risk: 'High', why: 'Reads keyboard state and is common in keyloggers.' },
  { api: 'SetWindowsHookEx', category: 'Keylogging', risk: 'High', why: 'Installs hooks that can capture keystrokes or UI events.' },
  { api: 'WinExec', category: 'Execution', risk: 'Medium', why: 'Runs a program or command.' },
  { api: 'ShellExecute', category: 'Execution', risk: 'Medium', why: 'Launches files, commands, or URLs.' },
];

const API_NAMES = API_RISK_DEFINITIONS.map(x => x.api);
const PACKED_SECTIONS = ['.upx', 'upx0', 'upx1', '.packed', '.aspack', '.adata', '.petite', '.mpress'];
const PACKER_HINTS = ['UPX', 'ASPack', 'Themida', 'VMProtect', 'Enigma', 'PECompact', 'MPRESS', 'FSG', 'Obsidium'];

function byteAt(input, offset) {
  return offset >= 0 && offset < input.length ? input.charCodeAt(offset) & 0xff : 0;
}

function u16(input, offset) {
  return byteAt(input, offset) | (byteAt(input, offset + 1) << 8);
}

function u32(input, offset) {
  return (byteAt(input, offset) | (byteAt(input, offset + 1) << 8) |
    (byteAt(input, offset + 2) << 16) | (byteAt(input, offset + 3) << 24)) >>> 0;
}

function ascii(input, offset, len) {
  let out = '';
  for (let i = 0; i < len; i++) {
    const c = byteAt(input, offset + i);
    if (!c) break;
    out += c >= 32 && c <= 126 ? String.fromCharCode(c) : '';
  }
  return out.trim();
}

function hex32(n) {
  return n === null || n === undefined ? null : `0x${Number(n >>> 0).toString(16).padStart(8, '0')}`;
}

function peTimestamp(seconds) {
  if (!seconds) return null;
  const d = new Date(seconds * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function subsystemName(v) {
  return ({
    1: 'Native',
    2: 'Windows GUI',
    3: 'Windows CUI',
    5: 'OS/2 CUI',
    7: 'POSIX CUI',
    9: 'Windows CE GUI',
    10: 'EFI application',
    11: 'EFI boot service driver',
    12: 'EFI runtime driver',
    14: 'Xbox',
    16: 'Windows boot application',
  })[v] || (v ? `Unknown (${v})` : null);
}

function dllCharacteristics(bits) {
  const map = [
    [0x0020, 'High entropy VA'],
    [0x0040, 'Dynamic base / ASLR'],
    [0x0080, 'Force integrity'],
    [0x0100, 'NX compatible'],
    [0x0200, 'No isolation'],
    [0x0400, 'No SEH'],
    [0x0800, 'No bind'],
    [0x1000, 'AppContainer'],
    [0x2000, 'WDM driver'],
    [0x4000, 'Control Flow Guard'],
    [0x8000, 'Terminal server aware'],
  ];
  return map.filter(([bit]) => (bits & bit) !== 0).map(([, label]) => label);
}

function rvaToOffset(rva, sections) {
  for (const s of sections) {
    const start = s.virtualAddress;
    const span = Math.max(s.virtualSize, s.rawSize);
    if (rva >= start && rva < start + span) return s.rawPtr + (rva - start);
  }
  return rva;
}

function parseImportTable(input, sections, rva, is64) {
  const imports = [];
  const dlls = [];
  const warnings = [];
  if (!rva) return { imports, dlls, warnings };
  let off = rvaToOffset(rva, sections);
  for (let i = 0; i < 80 && off + 20 <= input.length; i++, off += 20) {
    const originalFirstThunk = u32(input, off);
    const nameRva = u32(input, off + 12);
    const firstThunk = u32(input, off + 16);
    if (!originalFirstThunk && !nameRva && !firstThunk) break;
    const dllName = ascii(input, rvaToOffset(nameRva, sections), 96);
    if (dllName) dlls.push(dllName);
    let thunk = rvaToOffset(originalFirstThunk || firstThunk, sections);
    for (let j = 0; j < 80 && thunk + (is64 ? 8 : 4) <= input.length; j++, thunk += is64 ? 8 : 4) {
      const thunkValue = u32(input, thunk);
      if (!thunkValue) break;
      const ordinalFlag = is64 ? 0x80000000 : 0x80000000;
      if ((thunkValue & ordinalFlag) !== 0) continue;
      const nameOff = rvaToOffset(thunkValue, sections);
      const importName = ascii(input, nameOff + 2, 128);
      if (importName && !imports.includes(importName)) imports.push(importName);
      if (imports.length >= 240) return { imports, dlls, warnings };
    }
  }
  if (!imports.length && dlls.length) warnings.push('Import DLL names parsed, but imported function names were not recoverable.');
  return { imports, dlls, warnings };
}

function parseExportTable(input, sections, rva) {
  const exports = [];
  if (!rva) return exports;
  const off = rvaToOffset(rva, sections);
  if (off + 40 > input.length) return exports;
  const nameCount = Math.min(u32(input, off + 24), 240);
  const namesRva = u32(input, off + 32);
  const namesOff = rvaToOffset(namesRva, sections);
  for (let i = 0; i < nameCount && namesOff + (i * 4) + 4 <= input.length; i++) {
    const nameRva = u32(input, namesOff + (i * 4));
    const name = ascii(input, rvaToOffset(nameRva, sections), 128);
    if (name && !exports.includes(name)) exports.push(name);
  }
  return exports;
}

export function parsePE(input) {
  const hasMZ = input.length > 1 && byteAt(input, 0) === 0x4d && byteAt(input, 1) === 0x5a;
  const peOffset = hasMZ ? u32(input, 0x3c) : -1;
  const hasPE = peOffset > 0 && peOffset + 248 < input.length && input.slice(peOffset, peOffset + 4) === 'PE\0\0';
  const warnings = [];
  const sections = [];
  const suspiciousApiStrings = API_NAMES.filter(api => new RegExp(api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(input));
  const packerHints = PACKER_HINTS.filter(h => new RegExp(h, 'i').test(input));

  if (!hasPE) {
    return {
      detected: hasMZ,
      hasMZ,
      hasPE,
      fileType: hasMZ ? 'MZ/DOS executable-like content' : 'No PE structure detected',
      architecture: 'Not available',
      timestamp: null,
      subsystem: null,
      dllCharacteristics: [],
      imageBase: null,
      entryPointRva: null,
      sections,
      imports: [],
      importDlls: [],
      exports: [],
      suspiciousApiStrings,
      packedIndicators: [],
      warnings: hasMZ ? ['MZ header found but PE signature or headers were not parsable from available bytes.'] : [],
      realImportTableParsed: false,
      packerHints,
    };
  }

  const machine = u16(input, peOffset + 4);
  const machineMap = { 0x014c: 'x86', 0x8664: 'x64', 0x01c0: 'ARM', 0xaa64: 'ARM64' };
  const sectionCount = Math.min(u16(input, peOffset + 6), 96);
  const timestampRaw = u32(input, peOffset + 8);
  const optSize = u16(input, peOffset + 20);
  const opt = peOffset + 24;
  const magic = u16(input, opt);
  const is64 = magic === 0x20b;
  const dataDirOffset = is64 ? 112 : 96;
  const entryPoint = u32(input, opt + 16);
  const imageBase = is64 ? `${hex32(u32(input, opt + 28))}${u32(input, opt + 24).toString(16).padStart(8, '0')}` : hex32(u32(input, opt + 28));
  const subsystem = subsystemName(u16(input, opt + 68));
  const dllChars = dllCharacteristics(u16(input, opt + 70));
  const exportRva = u32(input, opt + dataDirOffset);
  const importRva = u32(input, opt + dataDirOffset + 8);
  const sectionTable = peOffset + 24 + optSize;

  for (let i = 0; i < sectionCount; i++) {
    const off = sectionTable + (i * 40);
    if (off + 40 > input.length) break;
    const name = ascii(input, off, 8) || `(section ${i + 1})`;
    const virtualSize = u32(input, off + 8);
    const virtualAddress = u32(input, off + 12);
    const rawSize = u32(input, off + 16);
    const rawPtr = u32(input, off + 20);
    const characteristics = u32(input, off + 36);
    const entropy = rawSize ? shannonEntropy(input.slice(rawPtr, Math.min(input.length, rawPtr + Math.min(rawSize, 256 * 1024)))) : 0;
    const executable = (characteristics & 0x20000000) !== 0;
    const writable = (characteristics & 0x80000000) !== 0;
    const notes = [];
    if (entropy >= 7.2) notes.push('high entropy');
    if (executable && writable) notes.push('executable and writable');
    if (PACKED_SECTIONS.some(p => name.toLowerCase().includes(p))) notes.push('suspicious/packer-like name');
    sections.push({
      name, virtualSize, rawSize, virtualAddress, rawPtr, entropy, executable, writable,
      suspicious: notes.length > 0,
      notes,
    });
  }

  const importInfo = parseImportTable(input, sections, importRva, is64);
  const exports = parseExportTable(input, sections, exportRva);
  warnings.push(...importInfo.warnings);
  const imports = importInfo.imports;

  const packedIndicators = [];
  const highEntropySections = sections.filter(s => s.entropy >= 7.2);
  const suspiciousSections = sections.filter(s => s.suspicious);
  const epSection = sections.find(s => entryPoint >= s.virtualAddress && entryPoint < s.virtualAddress + Math.max(s.virtualSize, s.rawSize));
  const maxRawEnd = sections.reduce((m, s) => Math.max(m, s.rawPtr + s.rawSize), 0);
  if (highEntropySections.length) packedIndicators.push(`High entropy sections: ${highEntropySections.map(s => `${s.name} (${s.entropy.toFixed(2)})`).join(', ')}`);
  if (suspiciousSections.some(s => s.executable && s.writable)) packedIndicators.push('Executable and writable section present');
  if (suspiciousSections.some(s => PACKED_SECTIONS.some(p => s.name.toLowerCase().includes(p)))) packedIndicators.push('Suspicious packed section name present');
  if (packerHints.length) packedIndicators.push(`Compiler/packer hints: ${packerHints.join(', ')}`);
  if (imports.length > 0 && imports.length <= 3) packedIndicators.push('Very few parsed imports');
  if (maxRawEnd > 0 && input.length - maxRawEnd > 512) packedIndicators.push(`Overlay data present (${(input.length - maxRawEnd).toLocaleString()} bytes)`);
  if (epSection && epSection.suspicious) packedIndicators.push(`Entry point falls in suspicious section: ${epSection.name}`);

  const ts = peTimestamp(timestampRaw);
  const year = ts ? new Date(ts).getUTCFullYear() : null;
  if (!timestampRaw) warnings.push('Compile timestamp is zero.');
  if (year && (year < 1995 || year > new Date().getUTCFullYear() + 1)) warnings.push('Compile timestamp appears anomalous.');

  const suspiciousImportCombos = [
    ['OpenProcess', 'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread'],
    ['LoadLibraryA', 'GetProcAddress'],
    ['MiniDumpWriteDump', 'OpenProcess'],
    ['InternetOpen', 'InternetOpenUrl'],
  ];
  suspiciousImportCombos.forEach(combo => {
    if (combo.filter(api => imports.includes(api) || suspiciousApiStrings.includes(api)).length >= Math.min(3, combo.length)) {
      packedIndicators.push(`Suspicious API combination: ${combo.join(' + ')}`);
    }
  });

  return {
    detected: hasMZ || hasPE || sections.length > 0,
    hasMZ,
    hasPE,
    fileType: 'Windows PE executable or DLL-like content',
    architecture: machineMap[machine] || `Unknown machine 0x${machine.toString(16)}`,
    timestamp: ts,
    subsystem,
    dllCharacteristics: dllChars,
    imageBase,
    entryPointRva: hex32(entryPoint),
    sections,
    imports,
    importDlls: importInfo.dlls,
    exports,
    suspiciousApiStrings,
    packedIndicators,
    warnings,
    realImportTableParsed: imports.length > 0,
    packerHints,
    optionalHeaderMagic: magic === 0x10b ? 'PE32' : magic === 0x20b ? 'PE32+' : `Unknown 0x${magic.toString(16)}`,
    overlayBytes: maxRawEnd > 0 && input.length > maxRawEnd ? input.length - maxRawEnd : 0,
  };
}

function printableStrings(text) {
  return [...new Set(text.match(/[ -~]{4,}/g) || [])]
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, MAX_STRINGS);
}

const STRING_CATEGORIES = [
  ['Network indicators', /https?:\/\/|ftp:\/\/|tcp:|udp:|socket|WinHttp|InternetOpen|URLDownload|curl|wget|bitsadmin/i, 'High'],
  ['URLs and domains', /https?:\/\/|(?:[a-z0-9-]+\.)+(?:com|net|org|ru|cn|io|xyz|top|onion)\b/i, 'High'],
  ['IPs', /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/i, 'High'],
  ['Email addresses', /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, 'Medium'],
  ['Windows API strings', new RegExp(API_NAMES.join('|'), 'i'), 'Medium'],
  ['Registry strings', /HKEY_|\\Software\\Microsoft\\Windows\\CurrentVersion\\Run|RunOnce|Winlogon/i, 'High'],
  ['File paths', /[A-Za-z]:\\|\/(?:tmp|var|etc|home|root|bin|usr|opt)\//i, 'Medium'],
  ['PowerShell strings', /powershell|EncodedCommand|FromBase64String|IEX|Invoke-|Set-MpPreference|NoProfile/i, 'High'],
  ['JavaScript strings', /ActiveXObject|WScript\.Shell|String\.fromCharCode|atob|document\.write|XMLHttpRequest|fetch/i, 'Medium'],
  ['Macro strings', /AutoOpen|Document_Open|Auto_Open|CreateObject|WScript\.Shell|URLDownloadToFile/i, 'High'],
  ['Crypto strings', /Crypt|AES|RC4|XOR|encrypt|decrypt|cipher|base64|sha256|md5/i, 'Medium'],
  ['Anti debug strings', /IsDebuggerPresent|CheckRemoteDebuggerPresent|NtQueryInformationProcess|OutputDebugString|debugger|sandbox/i, 'Medium'],
  ['Persistence strings', /schtasks|CurrentVersion\\Run|CreateService|systemctl|crontab|authorized_keys|Startup/i, 'High'],
  ['Credential access strings', /mimikatz|sekurlsa|lsass|MiniDumpWriteDump|CryptUnprotectData|password|credential|Login Data/i, 'High'],
  ['Ransomware strings', /vssadmin|shadowcopy|decrypt|ransom|bitcoin|\.locked|README.*DECRYPT|HOW_TO_DECRYPT/i, 'High'],
  ['C2 strings', /beacon|c2|teamserver|meterpreter|\.onion|socks5|stratum\+tcp/i, 'High'],
  ['Linux persistence strings', /crontab|\/etc\/cron|systemctl enable|\.bashrc|authorized_keys|\/etc\/rc\.local/i, 'High'],
  ['Suspicious commands', /\b(cmd\.exe|powershell|mshta|regsvr32|rundll32|certutil|bitsadmin|schtasks|vssadmin|wmic|curl|wget)\b/i, 'High'],
];

export function buildStringsIntelligence(input) {
  const strings = printableStrings(input);
  return STRING_CATEGORIES.map(([name, rx, confidence]) => {
    const items = strings.filter(s => rx.test(s)).slice(0, 12);
    return {
      name,
      confidence,
      explanation: 'Static string category. Analyst validation required.',
      items,
    };
  }).filter(c => c.items.length);
}

export function buildApiRisk(pe) {
  const imports = new Set(pe.imports || []);
  const strings = new Set(pe.suspiciousApiStrings || []);
  return API_RISK_DEFINITIONS
    .filter(def => imports.has(def.api) || strings.has(def.api))
    .map(def => ({
      ...def,
      detectedAs: imports.has(def.api) ? 'real import' : 'string only',
    }));
}

function yaraString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 120);
}

function yaraRuleName(category) {
  return `ThreatRecon_${String(category || 'Suspicious_Triage').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Suspicious_Triage'}`;
}

export function generateDraftYara({ iocs, category, apiRisk, stringsIntelligence, behaviors, isDemo }) {
  const candidates = [];
  const add = (value, reason) => {
    if (!value || value.length < 5) return;
    if (isDemo && /example\.(com|org|net)|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.|DemoDemo/i.test(value)) return;
    if (/^[a-f0-9]{32,64}$/i.test(value)) return;
    if (!candidates.some(c => c.value.toLowerCase() === value.toLowerCase())) candidates.push({ value, reason });
  };
  (behaviors || []).slice(0, 5).forEach(b => add(b.label, 'behavior'));
  (apiRisk || []).slice(0, 8).forEach(a => add(a.api, a.category));
  [...(iocs.registry || []), ...(iocs.paths || []), ...(iocs.mutex || [])].forEach(v => add(v, 'artifact'));
  [...(iocs.urls || []), ...(iocs.domains || [])].forEach(v => add(v, 'network'));
  (stringsIntelligence || []).forEach(c => c.items.slice(0, 2).forEach(v => add(v, c.name)));
  const selected = candidates.slice(0, MAX_RULE_STRINGS);
  const strings = selected.map((s, idx) => `    $s${idx + 1} = "${yaraString(s.value)}" nocase // ${yaraString(s.reason)}`).join('\n');
  const needed = selected.length >= 4 ? '3 of them' : selected.length >= 2 ? '2 of them' : 'any of them';
  return `rule ${yaraRuleName(category)} {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "${selected.length >= 4 ? 'medium' : 'low'}"
  strings:
${strings || '    $s1 = "review_required" nocase'}
  condition:
    ${selected.length ? needed : '$s1'}
}`;
}

function sigmaEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 180);
}

const SIGMA_PATTERNS = [
  ['Encoded PowerShell', /-enc|-encodedcommand|FromBase64String/i, 'process_creation', 'high', ['T1059.001', 'T1027.010'], ['powershell', '-enc']],
  ['certutil download', /certutil.*(?:urlcache|split|-f|http)/i, 'process_creation', 'high', ['T1105', 'T1140'], ['certutil', 'http']],
  ['regsvr32 remote scriptlet', /regsvr32.*(?:http|scrobj|\/i)/i, 'process_creation', 'high', ['T1218.010'], ['regsvr32', 'http']],
  ['rundll32 suspicious execution', /rundll32/i, 'process_creation', 'medium', ['T1218.011'], ['rundll32']],
  ['scheduled task persistence', /schtasks.*\/create|Register-ScheduledTask/i, 'process_creation', 'high', ['T1053.005'], ['schtasks', '/create']],
  ['registry run key persistence', /CurrentVersion\\Run|reg\s+add\s+HK/i, 'registry_set', 'high', ['T1547.001'], ['CurrentVersion\\\\Run']],
  ['vssadmin shadow deletion', /vssadmin.*delete|shadowcopy.*delete/i, 'process_creation', 'critical', ['T1490'], ['vssadmin', 'delete']],
  ['LSASS dumping', /lsass|MiniDumpWriteDump|comsvcs\.dll|procdump/i, 'process_creation', 'critical', ['T1003.001'], ['lsass']],
  ['Defender tampering', /Set-MpPreference|DisableRealtimeMonitoring|Add-MpPreference/i, 'process_creation', 'high', ['T1562.001'], ['Set-MpPreference']],
];

export function generateDraftSigma(input, mitreRows = []) {
  const matches = SIGMA_PATTERNS.filter(([, rx]) => rx.test(input)).slice(0, 8);
  const tags = [...new Set([...(matches.flatMap(m => m[4])), ...(mitreRows || []).map(r => r.techniqueId)])]
    .filter(Boolean).map(t => `attack.${t.toLowerCase().replace('.', '_')}`);
  if (!matches.length) {
    return `title: ThreatRecon Suspicious Static Triage
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - review_required
  condition: selection
falsepositives:
  - Unknown
level: low`;
  }
  const terms = [...new Set(matches.flatMap(m => m[5]))].slice(0, 16);
  return `title: ThreatRecon ${sigmaEscape(matches[0][0])}
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
${terms.map(t => `      - "${sigmaEscape(t)}"`).join('\n')}
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: ${matches.some(m => m[3] === 'critical') ? 'critical' : matches.some(m => m[3] === 'high') ? 'high' : 'medium'}
tags:
${(tags.length ? tags : ['attack.execution']).map(t => `  - ${t}`).join('\n')}`;
}

function techniqueName(id, mitreMap = {}) {
  const label = mitreMap[id] || id;
  return label.includes('—') ? label.split('—').slice(1).join('—').trim() : label;
}

function tacticForTechnique(id) {
  if (/T1059|T1218|T1127/.test(id)) return 'Execution';
  if (/T1027|T1140|T1562|T1564|T1070/.test(id)) return 'Defense Evasion';
  if (/T1105/.test(id)) return 'Command and Control';
  if (/T1053|T1547|T1543|T1546|T1098/.test(id)) return 'Persistence';
  if (/T1003|T1552|T1555/.test(id)) return 'Credential Access';
  if (/T1082|T1046/.test(id)) return 'Discovery';
  if (/T1486|T1490|T1496/.test(id)) return 'Impact';
  if (/T1071|T1090/.test(id)) return 'Command and Control';
  if (/T1136/.test(id)) return 'Persistence';
  return 'Defense Evasion';
}

function detectionIdeaFor(id, evidence) {
  if (/T1059\.001/.test(id)) return 'Monitor PowerShell command line arguments, encoded commands, hidden windows, and suspicious parents.';
  if (/T1490/.test(id)) return 'Alert on shadow copy deletion, wbadmin deletion, and recovery configuration tampering.';
  if (/T1003/.test(id)) return 'Alert on LSASS handle access, dump files, procdump, comsvcs.dll, and MiniDumpWriteDump.';
  if (/T1547\.001/.test(id)) return 'Monitor registry Run and Winlogon key creation or modification.';
  if (/T1053/.test(id)) return 'Alert on suspicious scheduled task creation and unusual task actions.';
  if (/T1105|T1071/.test(id)) return 'Hunt for command lines or processes contacting extracted network IOCs.';
  if (/T1218/.test(id)) return 'Alert on LOLBin execution with remote URLs, scriptlets, or unusual child processes.';
  if (/T1562/.test(id)) return 'Monitor Defender, firewall, and security tooling tamper commands.';
  return `Hunt for evidence containing "${String(evidence || '').slice(0, 60)}" in process, registry, and script telemetry.`;
}

export function buildAttackTable(behaviors, mitreList, mitreMap = {}) {
  const rows = [];
  const seen = new Set();
  (behaviors || []).forEach(b => {
    String(b.tech || '').split(',').map(t => t.trim()).filter(Boolean).forEach(id => {
      const key = id + b.label;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        tactic: tacticForTechnique(id),
        techniqueId: id,
        techniqueName: techniqueName(id, mitreMap),
        observedEvidence: b.label,
        confidence: b.sev === 'CRITICAL' || b.sev === 'HIGH' ? 'High' : b.sev === 'MED' ? 'Medium' : 'Low',
        detectionIdea: detectionIdeaFor(id, b.label),
      });
    });
  });
  (mitreList || []).forEach(id => {
    if (rows.some(r => r.techniqueId === id)) return;
    rows.push({
      tactic: tacticForTechnique(id),
      techniqueId: id,
      techniqueName: techniqueName(id, mitreMap),
      observedEvidence: 'Technique inferred from IOC or static context',
      confidence: 'Medium',
      detectionIdea: detectionIdeaFor(id, id),
    });
  });
  return rows.slice(0, 24);
}

const TIMELINE_STAGES = [
  ['Initial Access', /phish|maldoc|macro|invoice|email|hta/i, 'Validate delivery vector and parent process.'],
  ['Execution', /powershell|cmd\.exe|wscript|cscript|mshta|rundll32|regsvr32|start-process|shell/i, 'Review process creation and script block logs.'],
  ['Defense Evasion', /bypass|hidden|Set-MpPreference|disable|obfuscat|encoded|debugger|sandbox/i, 'Check security control tampering and obfuscation telemetry.'],
  ['Payload Download', /download|Invoke-WebRequest|curl|wget|certutil|bitsadmin|http/i, 'Validate network connections and downloaded file hashes.'],
  ['Persistence', /schtasks|CurrentVersion\\Run|CreateService|systemctl|cron|authorized_keys/i, 'Inspect autoruns, scheduled tasks, services, and shell profiles.'],
  ['Discovery', /whoami|systeminfo|ipconfig|net user|nltest|net group|nmap|arp/i, 'Correlate host and network discovery commands.'],
  ['Credential Access', /mimikatz|sekurlsa|lsass|MiniDumpWriteDump|procdump|credential|password/i, 'Hunt for LSASS access, dump files, and credential store reads.'],
  ['Collection', /archive|compress|zip|rar|collect|clipboard|screenshot/i, 'Look for staging directories, archives, and clipboard/screenshot access.'],
  ['Command and Control', /\.onion|beacon|c2|meterpreter|socks5|connect|InternetOpen|WinHttp/i, 'Review DNS, proxy, firewall, and EDR network telemetry.'],
  ['Exfiltration', /exfil|upload|POST|ftp|send\(|webhook|telegram|discord/i, 'Search outbound transfers to suspicious infrastructure.'],
  ['Impact', /vssadmin|shadowcopy|ransom|decrypt|\.locked|encrypt|wbadmin/i, 'Validate shadow copy deletion, encryption, and ransom note activity.'],
];

export function buildAttackTimeline({ input, behaviors, peTriage, apiRisk }) {
  const evidenceText = `${input}\n${(behaviors || []).map(b => b.label).join('\n')}\n${(apiRisk || []).map(a => a.api).join('\n')}`;
  const rows = TIMELINE_STAGES.map(([stage, rx, validation]) => {
    const hits = [];
    (behaviors || []).forEach(b => { if (rx.test(b.label)) hits.push(b.label); });
    (apiRisk || []).forEach(a => { if (rx.test(`${a.api} ${a.category}`)) hits.push(`${a.api} (${a.category})`); });
    if (rx.test(evidenceText) && !hits.length) hits.push(`Static text matched ${stage.toLowerCase()} keywords.`);
    const related = (behaviors || []).find(b => rx.test(b.label))?.tech?.split(',')[0]?.trim() || null;
    return {
      stage,
      evidence: [...new Set(hits)].slice(0, 3),
      confidence: hits.length >= 2 ? 'High' : hits.length ? 'Medium' : 'Low',
      technique: related,
      validation,
    };
  }).filter(r => r.evidence.length);
  if (peTriage?.detected && !rows.some(r => r.stage === 'Execution')) {
    rows.unshift({ stage: 'Execution', evidence: ['PE structure detected; validate entry point and imports.'], confidence: 'Medium', technique: null, validation: 'Open in PEStudio, DIE, PE-bear, Ghidra, or Cutter in an authorized lab.' });
  }
  return rows.length ? rows : [{ stage: 'Triage', evidence: ['No clear attack timeline inferred from static evidence.'], confidence: 'Low', technique: null, validation: 'Collect additional context such as process tree, file path, and parent command line.' }];
}

function decodeUnicodeEscapes(input) {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function pushDecoded(results, seen, type, raw, decoded) {
  if (!decoded || decoded === raw || decoded.length > 20000) return;
  const printable = decoded.replace(/[\x09\x0A\x0D\x20-\x7E]/g, '').length / Math.max(1, decoded.length) < 0.35;
  if (!printable) return;
  const key = `${type}|${decoded.slice(0, 100)}`;
  if (seen.has(key)) return;
  seen.add(key);
  results.push({ type, raw: String(raw).slice(0, 300), decoded: decoded.slice(0, 2000) });
}

export function advancedDecode(input, baseResults = []) {
  const results = [...baseResults].slice(0, MAX_DECODED);
  const seen = new Set(results.map(r => `${r.type}|${String(r.decoded).slice(0, 100)}`));
  let m;
  const uniRx = /(?:\\u[0-9a-fA-F]{4}){3,}/g;
  while ((m = uniRx.exec(input)) && results.length < MAX_DECODED) pushDecoded(results, seen, 'Unicode escapes', m[0], decodeUnicodeEscapes(m[0]));

  const psCharRx = /\[char\]\s*(\d{2,3})(?:\s*\+\s*\[char\]\s*(\d{2,3}))+/gi;
  while ((m = psCharRx.exec(input)) && results.length < MAX_DECODED) {
    const nums = [...m[0].matchAll(/\[char\]\s*(\d{2,3})/gi)].map(x => Number(x[1])).filter(n => n >= 0 && n <= 255);
    if (nums.length >= 3) pushDecoded(results, seen, 'PowerShell char array', m[0], String.fromCharCode(...nums));
  }

  const joinRx = /@\(([\d,\s]{9,})\)\s*-join\s*['"]{0,2}/gi;
  while ((m = joinRx.exec(input)) && results.length < MAX_DECODED) {
    const nums = m[1].split(',').map(x => Number(x.trim())).filter(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (nums.length >= 4) pushDecoded(results, seen, 'PowerShell join char array', m[0], String.fromCharCode(...nums));
  }

  const xorRx = /(?:0x[0-9a-fA-F]{2}[,\s]*){6,}|(?:\\x[0-9a-fA-F]{2}){6,}/g;
  while ((m = xorRx.exec(input)) && results.length < MAX_DECODED) {
    const bytes = [...m[0].matchAll(/(?:0x|\\x)([0-9a-fA-F]{2})/g)].map(x => parseInt(x[1], 16)).slice(0, 128);
    if (bytes.length < 6 || bytes.length > 128) continue;
    for (let key = 1; key <= 255; key++) {
      const decoded = String.fromCharCode(...bytes.map(b => b ^ key));
      if (/powershell|cmd\.exe|http|MZ|This program|vssadmin|rundll32/i.test(decoded)) {
        pushDecoded(results, seen, `Single-byte XOR key 0x${key.toString(16).padStart(2, '0')}`, m[0], decoded);
        break;
      }
    }
  }

  if (/rot13|rot-13/i.test(input)) {
    const rotRx = /[A-Za-z]{8,}/g;
    while ((m = rotRx.exec(input)) && results.length < MAX_DECODED) pushDecoded(results, seen, 'ROT13', m[0], rot13(m[0]));
  }

  return results.slice(0, MAX_DECODED);
}

function setOf(arr) {
  return new Set((arr || []).map(x => String(x).toLowerCase()));
}

function shared(a, b) {
  const bs = setOf(b);
  return [...new Set(a || [])].filter(x => bs.has(String(x).toLowerCase()));
}

export function compareSamples(inputA, inputB, behaviorRules = [], yaraRules = []) {
  const iocsA = extractIOCs(inputA);
  const iocsB = extractIOCs(inputB);
  const stringsA = printableStrings(inputA).slice(0, 120);
  const stringsB = printableStrings(inputB).slice(0, 120);
  const behaviorsA = behaviorRules.filter(r => r.rx.test(inputA)).map(r => r.label);
  const behaviorsB = behaviorRules.filter(r => r.rx.test(inputB)).map(r => r.label);
  const yaraA = yaraRules.filter(r => r.rx.test(inputA)).map(r => r.name);
  const yaraB = yaraRules.filter(r => r.rx.test(inputB)).map(r => r.name);
  const mitreA = behaviorRules.filter(r => r.rx.test(inputA)).flatMap(r => String(r.tech || '').split(',').map(t => t.trim()).filter(Boolean));
  const mitreB = behaviorRules.filter(r => r.rx.test(inputB)).flatMap(r => String(r.tech || '').split(',').map(t => t.trim()).filter(Boolean));
  const sharedIocs = {};
  ['ips', 'urls', 'domains', 'md5', 'sha1', 'sha256', 'registry', 'paths', 'mutex'].forEach(k => { sharedIocs[k] = shared(iocsA[k], iocsB[k]); });
  const sharedStrings = shared(stringsA, stringsB).slice(0, 20);
  const sharedBehaviors = shared(behaviorsA, behaviorsB).slice(0, 20);
  const sharedYara = shared(yaraA, yaraB).slice(0, 20);
  const sharedMitre = shared(mitreA, mitreB).slice(0, 20);
  const sharedCount = Object.values(sharedIocs).flat().length + sharedStrings.length + sharedBehaviors.length + sharedYara.length + sharedMitre.length;
  const score = Math.min(100, sharedCount * 8 + sharedYara.length * 8 + sharedMitre.length * 5);
  return {
    similarityScore: score,
    possibleRelation: score >= 70 ? 'High' : score >= 35 ? 'Medium' : 'Low',
    reasoning: score >= 70 ? 'Multiple shared IOCs, behaviors, strings, or techniques suggest a likely relationship.' : score >= 35 ? 'Some shared indicators suggest possible relationship, but validation is required.' : 'Few shared indicators were found.',
    sharedIocs,
    uniqueIocsA: Object.fromEntries(Object.entries(iocsA).map(([k, v]) => [k, (v || []).filter(x => !setOf(iocsB[k]).has(String(x).toLowerCase()))])),
    uniqueIocsB: Object.fromEntries(Object.entries(iocsB).map(([k, v]) => [k, (v || []).filter(x => !setOf(iocsA[k]).has(String(x).toLowerCase()))])),
    sharedStrings,
    sharedBehaviors,
    sharedYara,
    sharedMitre,
  };
}

const SAFE_PUBLIC_RESOLVERS = new Set(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9']);
const RESERVED_DEMO_DOMAINS = ['example.com', 'example.org', 'example.net', 'example.edu'];
const RESERVED_DEMO_TLDS = ['example', 'test', 'invalid', 'localhost'];
const RESERVED_SINGLE_LABELS = new Set(['test', 'localhost', 'invalid', 'local']);

function ipv4Parts(value) {
  const m = String(value || '').match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255) ? parts : null;
}

function hostFromValue(value) {
  const raw = String(value || '').trim().toLowerCase().replace(/\.$/, '');
  if (!raw) return '';
  try {
    return new URL(raw).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return raw.replace(/^\[|\]$/g, '').split('/')[0].split(':')[0].replace(/\.$/, '');
  }
}

export function isDocumentationIp(ip) {
  const parts = ipv4Parts(ip);
  if (!parts) return false;
  const [a, b, c] = parts;
  return (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113);
}

export function isKnownPublicResolverIp(ip) {
  return SAFE_PUBLIC_RESOLVERS.has(String(ip || '').trim());
}

export function isReservedDemoDomain(value) {
  const host = hostFromValue(value);
  if (!host) return false;
  if (RESERVED_SINGLE_LABELS.has(host)) return true;
  if (RESERVED_DEMO_DOMAINS.some(d => host === d || host.endsWith(`.${d}`))) return true;
  const tld = host.split('.').pop();
  return RESERVED_DEMO_TLDS.includes(tld);
}

function networkActionability(type, value, isLocalPrivateIp) {
  const host = type === 'url' ? hostFromValue(value) : String(value || '').trim().toLowerCase();
  const ipHost = ipv4Parts(host) ? host : null;

  if (ipHost && isLocalPrivateIp && isLocalPrivateIp(ipHost)) {
    return {
      actionable: false,
      reason: 'Local/private/special IP is local context only.',
      recommendedAction: 'Use for host triage or lab context; do not add to network blocklists.',
    };
  }
  if (ipHost && isDocumentationIp(ipHost)) {
    return {
      actionable: false,
      reason: 'Reserved documentation IP range; training/demo indicator only.',
      recommendedAction: 'Keep for report context; do not block.',
    };
  }
  if (ipHost && isKnownPublicResolverIp(ipHost)) {
    return {
      actionable: false,
      reason: 'Known public DNS resolver; do not block from demo/static context.',
      recommendedAction: 'Validate surrounding behavior instead of blocking shared resolver infrastructure.',
    };
  }
  if (!ipHost && isReservedDemoDomain(host)) {
    return {
      actionable: false,
      reason: 'Reserved documentation, local, or test domain; training/demo indicator only.',
      recommendedAction: 'Keep for analyst context; do not add to DNS or URL blocklists.',
    };
  }
  return {
    actionable: true,
    reason: type === 'ip' ? 'Public routable IP indicator requiring validation.' : `${type === 'url' ? 'URL' : 'Domain'} indicator requiring validation.`,
    recommendedAction: type === 'ip' ? 'Validate reputation and consider firewall/proxy/EDR block only if confirmed malicious.' : 'Validate reputation and consider DNS/proxy/URL block only if confirmed malicious.',
  };
}

export function buildActionableBlocklist(iocActionability) {
  return (iocActionability || [])
    .filter(r => r.actionable && ['ip', 'domain', 'url', 'hash'].includes(r.type))
    .map(r => r.value);
}

export function buildIOCActionability(iocs, _isDemo, _isDocumentationIp, isLocalPrivateIp) {
  const rows = [];
  const add = (type, values, confidence, actionable, reason, recommendedAction) => {
    (values || []).forEach(value => rows.push({ type, value, confidence, actionable, reason, recommendedAction }));
  };
  (iocs.ips || []).forEach(value => {
    const verdict = networkActionability('ip', value, isLocalPrivateIp);
    rows.push({ type: 'ip', value, confidence: 'High', ...verdict });
  });
  add('local_ip', iocs.localIndicators, 'High', false, 'Local/private/special IP is local context only.', 'Use for host triage, not network blocklists.');
  (iocs.domains || []).forEach(value => {
    const verdict = networkActionability('domain', value, isLocalPrivateIp);
    rows.push({ type: 'domain', value, confidence: 'Medium', ...verdict });
  });
  (iocs.urls || []).forEach(value => {
    const verdict = networkActionability('url', value, isLocalPrivateIp);
    rows.push({ type: 'url', value, confidence: 'Medium', ...verdict });
  });
  add('email', iocs.emails, 'Low', false, 'Email is context unless tied to phishing or ransom', 'Use in mail-flow and case context searches.');
  add('registry_key', iocs.registry, 'High', false, 'Registry path is a host hunt indicator', 'Hunt endpoint telemetry and autoruns.');
  add('file_path', iocs.paths, 'Medium', false, 'File path is a host hunt indicator', 'Hunt endpoint file/process telemetry.');
  add('mutex', iocs.mutex, 'Medium', false, 'Mutex is a host hunt indicator', 'Hunt process telemetry or memory artifacts.');
  add('hash', [...(iocs.md5 || []), ...(iocs.sha1 || []), ...(iocs.sha256 || [])], 'High', true, 'Hash indicator', 'Use for EDR hash hunts; block only after validation.');
  return rows;
}

export function buildDetectionEngineering({ draftYara, draftSigma, huntingQueries, blocklist }) {
  return {
    draftSigma,
    draftYara,
    splunk: (huntingQueries || []).map(q => q.splunk),
    defender: (huntingQueries || []).map(q => q.defender),
    elastic: (huntingQueries || []).map(q => q.elastic),
    firewallBlocklist: blocklist || [],
    dnsBlocklist: (blocklist || []).filter(v => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v)),
    edrHashHunts: (blocklist || []).filter(v => /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(v)).map(h => `Search endpoint file/process telemetry for hash ${h}`),
  };
}
