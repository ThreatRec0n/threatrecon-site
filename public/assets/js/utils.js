/* =====================================================================
   ThreatRecon — utils.js
   Pure, side-effect-free helper functions. Everything here runs entirely
   in the browser. There are NO network calls, NO eval, and NO Function
   constructor anywhere in this file. Decoders only TRANSFORM text — they
   never execute it. Decoded output is always rendered via textContent or
   escaped before being placed in the DOM (see app.js).
   ===================================================================== */

/**
 * Escape HTML-significant characters so user-controlled text can never be
 * interpreted as markup when inserted via innerHTML. Used as the single
 * source of truth for XSS-safe rendering of untrusted data.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** SHA-256 of a string using the browser-native SubtleCrypto (local, no API). */
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return hex(buf);
}

/** SHA-1 of a string using the browser-native SubtleCrypto (local, no API). */
export async function sha1(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return hex(buf);
}

function hex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Shannon entropy in bits/byte. Higher values suggest packing/encryption. */
export function shannonEntropy(str) {
  if (!str.length) return 0;
  const freq = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((acc, f) => {
    const p = f / len;
    return acc + p * Math.log2(p);
  }, 0);
}

/** ROT13 substitution. Letters only; everything else is untouched. */
export function rot13(str) {
  return str.replace(/[A-Za-z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/** Decode a hex byte string like "0x48 0x65" or "\x48\x65" to ASCII, or null. */
export function decodeHexString(hexStr) {
  try {
    const cleaned = hexStr.replace(/0x/gi, '').replace(/\\x/gi, '').replace(/\s+/g, '');
    if (cleaned.length < 2 || cleaned.length % 2 !== 0) return null;
    let out = '';
    for (let i = 0; i < cleaned.length; i += 2) {
      const byte = parseInt(cleaned.substr(i, 2), 16);
      if (Number.isNaN(byte)) return null;
      out += String.fromCharCode(byte);
    }
    return out;
  } catch {
    return null;
  }
}

/** Proportion of non-printable characters in a decoded string (0..1). */
function nonPrintableRatio(s) {
  if (!s.length) return 1;
  // Allow common printable ASCII plus tab/newline/carriage return.
  return s.replace(/[\x09\x0A\x0D\x20-\x7E]/g, '').length / s.length;
}

/** True when a decode looks like readable text rather than binary noise. */
function looksPrintable(s) {
  return s.length > 0 && nonPrintableRatio(s) <= 0.30;
}

/** Safe atob wrapper that returns null instead of throwing. */
function tryAtob(b64) {
  try {
    let cleaned = b64.replace(/\s+/g, '');
    if (cleaned.length % 4 === 1) cleaned += 'A';
    const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function printableAsciiRatio(s) {
  if (!s.length) return 0;
  return s.replace(/[\x09\x0A\x0D\x20-\x7E]/g, '').length / s.length;
}

function bestPrintableBase64Decode(b64) {
  const ascii = tryAtob(b64);
  if (ascii === null) return null;
  const utf16 = decodePsEncoded(b64);
  const candidates = [
    { decoded: utf16, score: 1 - printableAsciiRatio(utf16) },
    { decoded: ascii, score: 1 - printableAsciiRatio(ascii) },
  ].filter(c => c.decoded && c.score >= 0.70);
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.decoded || null;
}

function trimTrailingDecodeArtifacts(value) {
  return String(value || '').replace(/[^\x09\x0A\x0D\x20-\x7E]+$/g, '');
}

/** Decode a PowerShell -EncodedCommand value (Base64 of UTF-16LE). */
export function decodePsEncoded(b64) {
  const raw = tryAtob(b64);
  if (raw === null) return null;
  // UTF-16LE: every other byte is typically 0x00 for ASCII text.
  let out = '';
  for (let i = 0; i < raw.length; i += 2) out += raw[i];
  return trimTrailingDecodeArtifacts(out);
}

/** Percent (URL) decode, returning null when invalid. */
export function tryUrlDecode(s) {
  try {
    const decoded = decodeURIComponent(s);
    return decoded !== s ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Extract and decode encoded/obfuscated blobs from input text. Supports
 * Base64, ROT13, hex (\xNN and 0xNN), URL/percent encoding, PowerShell
 * -EncodedCommand (UTF-16LE Base64), JavaScript atob/String.fromCharCode
 * patterns, char-code arrays, and simple reversed-string hints. Attempts up to two decode layers so
 * nested encodings (e.g. Base64 inside Base64) are surfaced.
 *
 * SECURITY: nothing here is ever executed. Each result is a plain object of
 * { type, raw, decoded } strings that the UI escapes before display.
 */
export function extractEncodedBlobs(input) {
  const results = [];
  const seen = new Set();
  const push = (type, raw, decoded) => {
    if (!decoded || !looksPrintable(decoded)) return;
    const key = type + '|' + decoded.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ type, raw, decoded });
    return decoded;
  };

  // PowerShell -EncodedCommand <base64>
  const psRx = /-e(?:nc|ncodedcommand)?\s+([A-Za-z0-9+/=]{16,})/gi;
  let m;
  while ((m = psRx.exec(input)) !== null) {
    const decoded = decodePsEncoded(m[1]);
    if (decoded && looksPrintable(decoded)) push('PowerShell EncodedCommand', m[1], decoded);
  }

  // Long quoted Base64 literals often feed a later variable reference such as
  // "-EncodedCommand $Encoded"; decode them without requiring command adjacency.
  const quotedB64Rx = /["']([A-Za-z0-9+/=]{40,})["']/g;
  while ((m = quotedB64Rx.exec(input)) !== null) {
    const raw = m[1];
    if (!/^[A-Za-z0-9+/]+=*$/.test(raw)) continue;
    const decoded = bestPrintableBase64Decode(raw);
    if (decoded) push('Quoted base64 string literal', raw, decoded);
  }

  // Base64 blobs (>= 24 chars). Try a second layer if the decode is itself base64-ish.
  const b64Rx = /(?:[A-Za-z0-9+/]{24,}={0,2})/g;
  while ((m = b64Rx.exec(input)) !== null) {
    const raw = m[0];
    const decoded = tryAtob(raw);
    if (decoded && looksPrintable(decoded)) {
      push('Base64', raw, decoded);
      // Layer 2: decoded content is also valid base64 text.
      if (/^[A-Za-z0-9+/]{16,}={0,2}$/.test(decoded.trim())) {
        const inner = tryAtob(decoded.trim());
        if (inner && looksPrintable(inner)) push('Base64 (layer 2)', decoded.trim(), inner);
      }
    }
  }

  // Hex: \xNN sequences
  const hexRx1 = /((?:\\x[0-9A-Fa-f]{2}){4,})/g;
  while ((m = hexRx1.exec(input)) !== null) {
    push('Hex (\\xNN)', m[1], decodeHexString(m[1]));
  }
  // Hex: 0xNN sequences
  const hexRx2 = /((?:0x[0-9A-Fa-f]{2}[ ,]*){4,})/g;
  while ((m = hexRx2.exec(input)) !== null) {
    push('Hex (0xNN)', m[1], decodeHexString(m[1]));
  }

  // URL / percent encoding — match a non-space token that carries percent
  // escapes (even when interleaved with literal text) and decode it.
  const urlRx = /\S*(?:%[0-9A-Fa-f]{2})\S*/g;
  while ((m = urlRx.exec(input)) !== null) {
    const tok = m[0];
    // Require at least two %XX escapes to avoid decoding stray single percents.
    if ((tok.match(/%[0-9A-Fa-f]{2}/g) || []).length < 2) continue;
    push('URL encoded', tok, tryUrlDecode(tok));
  }

  // JavaScript atob("...") and atob('...') patterns.
  const atobRx = /atob\s*\(\s*['"]([A-Za-z0-9+/=]{12,})['"]\s*\)/gi;
  while ((m = atobRx.exec(input)) !== null) {
    push('JavaScript atob()', m[1], tryAtob(m[1]));
  }

  // String.fromCharCode(72,101,108,108,111) and similar numeric arrays.
  const charCodeRx = /String\.fromCharCode\s*\(\s*([0-9,\s]{11,})\s*\)/gi;
  while ((m = charCodeRx.exec(input)) !== null) {
    const nums = m[1].split(',').map(x => Number(x.trim())).filter(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (nums.length >= 4) push('String.fromCharCode', m[0], String.fromCharCode(...nums));
  }

  const arrayCharRx = /\[\s*((?:\d{2,3}\s*,\s*){4,}\d{2,3})\s*\]\s*(?:\.map|\.forEach|;)/g;
  while ((m = arrayCharRx.exec(input)) !== null) {
    const nums = m[1].split(',').map(x => Number(x.trim())).filter(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (nums.length >= 4) push('Char code array', m[0], String.fromCharCode(...nums));
  }

  // Simple reversal only when the sample hints at reversal to avoid noise.
  if (/reverse\s*\(|\.split\(['"]{2}\)\.reverse\(\)|strrev/i.test(input)) {
    const revRx = /['"]([A-Za-z0-9_:/?&=.%\-]{12,})['"]/g;
    while ((m = revRx.exec(input)) !== null) {
      const decoded = m[1].split('').reverse().join('');
      if (/https?:\/\/|powershell|cmd\.exe|\.exe|\/bin\//i.test(decoded)) push('Simple string reversal', m[1], decoded);
    }
  }

  // ROT13: long alphabetic runs that decode to different readable text.
  const rotRx = /[A-Za-z]{16,}/g;
  while ((m = rotRx.exec(input)) !== null) {
    const raw = m[0];
    const decoded = rot13(raw);
    if (decoded !== raw && looksPrintable(decoded) && !/^[A-Za-z0-9+/]+=*$/.test(decoded.slice(0, 24))) {
      // Only surface ROT13 when the source contains a hint, to avoid noise.
      if (/rot13|rot-13/i.test(input)) push('ROT13', raw, decoded);
    }
  }

  return results.slice(0, 30);
}

/** Classify interesting strings into network/crypto/evasion/suspicious buckets. */
export function extractPrintableStrings(text, minLength = 4, limit = 300) {
  const min = Math.max(1, Number(minLength) || 4);
  return [...new Set(String(text || '').match(new RegExp(`[ -~]{${min},}`, 'g')) || [])]
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, limit);
}

/** Classify interesting printable strings into network/crypto/evasion/suspicious buckets. */
export function classifyStrings(text) {
  const lines = extractPrintableStrings(text, 5, 300);
  const results = [];
  for (const line of lines.slice(0, 300)) {
    const t = line.trim();
    if (/https?:\/\/|ftp:\/\/|tcp:|udp:|socket/i.test(t)) results.push({ type: 'network', val: t.slice(0, 90) });
    else if (/aes|rc4|xor|md5|sha|encrypt|decrypt|base64|cipher|key\s*=/i.test(t)) results.push({ type: 'crypto', val: t.slice(0, 90) });
    else if (/bypass|evasion|disable|inject|hook|patch|stealth|sandbox|debugger|isdebugg/i.test(t)) results.push({ type: 'evasion', val: t.slice(0, 90) });
    else if (/password|credential|token|session|cookie|apikey|secret|authorization/i.test(t)) results.push({ type: 'suspicious', val: t.slice(0, 90) });
  }
  return results.slice(0, 30);
}

export function classifyIpAddress(ip) {
  const value = String(ip || '').trim();
  if (value.includes(':')) {
    if (/^(::1|::)$/i.test(value)) return { reserved: true, category: 'loopback', reason: 'Loopback address (RFC 1122).' };
    if (/^fe8|^fe9|^fea|^feb/i.test(value)) return { reserved: true, category: 'link-local', reason: 'Link-local address (RFC 4291).' };
    if (/^fc|^fd/i.test(value)) return { reserved: true, category: 'unique-local', reason: 'Unique local IPv6 address (RFC 4193).' };
    if (/^ff/i.test(value)) return { reserved: true, category: 'multicast', reason: 'Multicast address; not suitable for IOC blocking.' };
    if (/^2001:db8:/i.test(value) || /^2001:db8::/i.test(value)) return { reserved: true, category: 'documentation', reason: 'Reserved documentation address (RFC 3849) — commonly used in examples and test data.' };
    return { reserved: false, category: 'public', reason: 'Public routable IP indicator requiring validation.' };
  }
  const m = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return { reserved: false, category: 'invalid', reason: 'Not a valid IP address.' };
  const a = +m[1], b = +m[2], c = +m[3], d = +m[4];
  if (a === 127) return { reserved: true, category: 'loopback', reason: 'Loopback address (RFC 1122).' };
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return { reserved: true, category: 'private', reason: 'Private network address (RFC 1918).' };
  if (a === 169 && b === 254) return { reserved: true, category: 'link-local', reason: 'Link-local address (RFC 3927).' };
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return { reserved: true, category: 'documentation', reason: 'Reserved documentation address (RFC 5737) — commonly used in examples and test data.' };
  if (a === 0) return { reserved: true, category: 'current-network', reason: 'Current network address range (0.0.0.0/8; RFC 1122).' };
  if (a === 100 && b >= 64 && b <= 127) return { reserved: true, category: 'shared-address-space', reason: 'Shared carrier-grade NAT address (RFC 6598).' };
  if (a === 192 && b === 0) return { reserved: true, category: 'iana-special-purpose', reason: 'IANA special-purpose address range (RFC 6890).' };
  if (a === 198 && (b === 18 || b === 19)) return { reserved: true, category: 'benchmarking', reason: 'Benchmark testing address range (RFC 2544).' };
  if (a === 255 && b === 255 && c === 255 && d === 255) return { reserved: true, category: 'broadcast', reason: 'Limited broadcast address (RFC 919/RFC 922).' };
  if (a >= 224 && a <= 239) return { reserved: true, category: 'multicast', reason: 'Multicast address range (RFC 5771).' };
  if (a >= 240 && a <= 255) return { reserved: true, category: 'reserved', reason: 'Reserved IPv4 address range (RFC 1112/RFC 6890).' };
  return { reserved: false, category: 'public', reason: 'Public routable IP indicator requiring validation.' };
}

/** True for non-routable/private/reserved IPs that should not be treated as external IOCs. */
export function isPrivateOrReservedIp(ip) {
  return classifyIpAddress(ip).reserved;
}

function refangForExtraction(value) {
  return String(value || '')
    .replace(/^hxxps/i, 'https')
    .replace(/^hxxp/i, 'http')
    .replace(/\[\.]|\(\.\)/g, '.')
    .replace(/\[:\/\/\]/g, '://')
    .replace(/\[:\]/g, ':');
}

/** Extract IOCs from text. All regex-based; capped per type to bound output. */
export function extractIOCs(text) {
  const ipRx = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
  const urlRx = /https?:\/\/[^\s"'<>\]]+/gi;
  const defangedUrlRx = /hxxps?(?::\/\/|\[:\/\/\]|\[:\]\/\/)[^\s"'<>)]+/gi;
  const onionRx = /\b[a-z2-7][a-z2-7-]{14,54}[a-z2-7]\.onion\b/gi;
  const domainRx = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,24}\b/gi;
  const defangedDomainRx = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\[\.]|\(\.\)))+[a-zA-Z]{2,24}\b/gi;
  const md5Rx = /\b[a-fA-F0-9]{32}\b/g;
  const sha1Rx = /\b[a-fA-F0-9]{40}\b/g;
  const sha256Rx = /\b[a-fA-F0-9]{64}\b/g;
  const emailRx = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const regRx = /(?:HKEY_[A-Z_]+|HK(?:CU|LM|CR|U|CC)):?(?:\\[^\s"']+)+/gi;
  const pathWinRx = /(?<![A-Za-z])[A-Za-z]:\\(?:[^\s"'<>\n]+\\)*[^\s"'<>\n]*/g;
  const pathUnixRx = /\/(?:tmp|var|etc|home|root|bin|usr|opt|dev|proc)\/[^\s"'<>\n]*/g;
  const btcRx = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
  const cveRx = /CVE-\d{4}-\d{4,7}/gi;
  const mutexRx = /(?:mutex|mutant|CreateMutex(?:A|W)?)\s*[:=]?\s*["']?([A-Za-z0-9_.\\-{}]{6,80})/gi;
  const selfReferenceDomains = new Set(['threatrecon.io', 'www.threatrecon.io']);
  const fileExtensionTlds = new Set(['bat', 'bin', 'cmd', 'dll', 'exe', 'msi', 'ps1', 'psm1', 'scr', 'sys', 'vbs']);

  const urls = [...new Set([...(text.match(urlRx) || []), ...(text.match(defangedUrlRx) || [])])].slice(0, 12);
  const rawDomains = [...new Set([...(text.match(domainRx) || []), ...(text.match(defangedDomainRx) || [])])];
  const urlHosts = new Set(urls.map(u => {
    try {
      return new URL(refangForExtraction(u)).hostname.toLowerCase();
    } catch {
      return '';
    }
  }).filter(Boolean));
  const domains = rawDomains
    .filter(d => {
      const normalized = refangForExtraction(d).toLowerCase();
      const tld = normalized.split('.').pop();
      return !urlHosts.has(normalized) && !selfReferenceDomains.has(normalized) && !fileExtensionTlds.has(tld);
    })
    .slice(0, 24);

  // Separate loopback/private/reserved IPs into a local-only bucket so they are
  // NOT treated as external IOCs or recommended for blocking.
  const allIps = [...new Set(text.match(ipRx) || [])];
  const ips = [];
  const localIndicators = [];
  allIps.forEach(ip => { (isPrivateOrReservedIp(ip) ? localIndicators : ips).push(ip); });

  const mutex = [];
  let mx;
  while ((mx = mutexRx.exec(text)) !== null) {
    if (!mutex.includes(mx[1])) mutex.push(mx[1]);
  }

  const registry = [...new Set(text.match(regRx) || [])].slice(0, 8);
  const registryValues = registry.map(r => r.toLowerCase());
  const paths = [...new Set([...(text.match(pathWinRx) || []), ...(text.match(pathUnixRx) || [])])]
    .filter(path => !registryValues.some(reg => reg.includes(String(path).toLowerCase())))
    .slice(0, 8);

  return {
    ips: ips.slice(0, 12),
    localIndicators: localIndicators.slice(0, 16),
    urls,
    domains,
    onion: [...new Set(text.match(onionRx) || [])].slice(0, 8),
    md5: [...new Set(text.match(md5Rx) || [])].slice(0, 6),
    sha1: [...new Set(text.match(sha1Rx) || [])].slice(0, 6),
    sha256: [...new Set(text.match(sha256Rx) || [])].slice(0, 6),
    emails: [...new Set(text.match(emailRx) || [])].slice(0, 6),
    registry,
    paths,
    btc: [...new Set(text.match(btcRx) || [])].slice(0, 4),
    cve: [...new Set(text.match(cveRx) || [])].slice(0, 6),
    mutex: mutex.slice(0, 6),
  };
}
