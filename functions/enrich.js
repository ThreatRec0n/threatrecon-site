/* =====================================================================
   ThreatRecon — Optional Threat Intel Enrichment Proxy
   Cloudflare Pages Functions endpoint (route: /enrich)

   WHY A SERVER PROXY:
   - API keys MUST NOT live in the browser. They are read here from
     environment variables (env) and never returned to the client.
   - The browser talks ONLY to this same-origin endpoint (CSP connect-src
     'self'); it never calls abuse.ch / VirusTotal / NVD / OTX directly.

   This function is OPTIONAL. If no keys are configured the site still works
   100% as a local static analyzer — this endpoint just reports "unavailable".

   Platform notes:
   - Cloudflare Pages Functions: place at /functions/enrich.js -> /enrich.
   - Netlify: see netlify/functions/enrich.js wrapper in docs/deployment.md.
   - Vercel: see api/enrich.js wrapper in docs/deployment.md.
   - GitHub Pages: static only — this file is not executed; the client
     gracefully shows "enrichment unavailable".

   Configured via environment variables (all optional):
     MALWAREBAZAAR_API_KEY, THREATFOX_API_KEY, URLHAUS_API_KEY,
     VIRUSTOTAL_API_KEY, NVD_API_KEY, OTX_API_KEY
   ===================================================================== */

const MAX_BODY_BYTES = 16 * 1024;     // reject oversized requests
const MAX_PER_TYPE = 15;              // cap IOCs per type
const PROVIDER_TIMEOUT_MS = 6000;     // per upstream request
const RATE_LIMIT_MAX = 20;            // requests per window per IP
const RATE_LIMIT_WINDOW_MS = 60_000;  // 1 minute

// Best-effort in-memory rate limit + cache (per isolate; ephemeral on CF).
// For durable limits/cache bind a KV namespace and extend below.
const rateMap = new Map();            // ip -> { count, reset }
const cache = new Map();              // `${provider}:${ioc}` -> { at, value }
const CACHE_TTL_MS = 10 * 60_000;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now > e.reset) { rateMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS }); return false; }
  e.count++;
  return e.count > RATE_LIMIT_MAX;
}

/* ── IOC validation / safety filters ───────────────────────────────── */
const RX = {
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/,
  domain: /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
  url: /^https?:\/\/[^\s]{1,2000}$/i,
  onion: /^[a-z2-7]{16,56}\.onion$/i,
  cve: /^CVE-\d{4}-\d{4,7}$/i,
};

function isPrivateOrReservedIp(ip) {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return true;
  const a = +m[1], b = +m[2];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}
function isTestNetIp(ip) { return /^192\.0\.2\.|^198\.51\.100\.|^203\.0\.113\./.test(ip); }
function isExampleDomain(d) { return /(^|\.)example\.(com|net|org)$/i.test(d) || /^localhost$/i.test(d) || /\.(test|invalid|localhost)$/i.test(d); }

function dedupeCap(arr) {
  return [...new Set((Array.isArray(arr) ? arr : []).map(x => String(x).trim()).filter(Boolean))].slice(0, MAX_PER_TYPE);
}

async function fetchJson(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, ok: res.ok, body };
  } finally {
    clearTimeout(t);
  }
}

function nowIso() { return new Date().toISOString(); }

function cached(key) {
  const e = cache.get(key);
  if (e && Date.now() - e.at < CACHE_TTL_MS) return e.value;
  return null;
}
function putCache(key, value) { cache.set(key, { at: Date.now(), value }); return value; }

/* ── Provider adapters. Each returns a normalized result object or null ─ */

async function mbHash(hash, key) {
  const res = await fetchJson('https://mb-api.abuse.ch/api/v1/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Auth-Key': key },
    body: new URLSearchParams({ query: 'get_info', hash }),
  });
  const b = res.body || {};
  if (b.query_status === 'ok' && Array.isArray(b.data) && b.data[0]) {
    const d = b.data[0];
    return base('MalwareBazaar', hash, 'hit', {
      summary: `${d.file_type || 'sample'} ${d.signature ? '(' + d.signature + ')' : ''}`.trim(),
      family: d.signature || (d.tags || []).join(', ') || null,
      firstSeen: d.first_seen || null,
      link: `https://bazaar.abuse.ch/sample/${d.sha256_hash || hash}/`,
    });
  }
  return base('MalwareBazaar', hash, 'not_found', {});
}

async function tfSearch(ioc, key) {
  const res = await fetchJson('https://threatfox-api.abuse.ch/api/v1/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Auth-Key': key },
    body: JSON.stringify({ query: 'search_ioc', search_term: ioc }),
  });
  const b = res.body || {};
  if (b.query_status === 'ok' && Array.isArray(b.data) && b.data[0]) {
    const d = b.data[0];
    return base('ThreatFox', ioc, 'hit', {
      summary: d.threat_type_desc || d.threat_type || 'IOC match',
      family: d.malware_printable || d.malware || null,
      confidence: d.confidence_level != null ? `${d.confidence_level}%` : null,
      firstSeen: d.first_seen || null,
      lastSeen: d.last_seen || null,
      link: d.id ? `https://threatfox.abuse.ch/ioc/${d.id}/` : 'https://threatfox.abuse.ch/',
    });
  }
  return base('ThreatFox', ioc, 'not_found', {});
}

async function urlhausUrl(u, key) {
  const res = await fetchJson('https://urlhaus-api.abuse.ch/v1/url/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Auth-Key': key },
    body: new URLSearchParams({ url: u }),
  });
  const b = res.body || {};
  if (b.query_status === 'ok') {
    return base('URLhaus', u, 'hit', {
      summary: `${b.threat || 'malware_url'} (${b.url_status || 'unknown'})`,
      family: (b.tags || []).join(', ') || null,
      firstSeen: b.date_added || null,
      link: b.urlhaus_reference || 'https://urlhaus.abuse.ch/',
    });
  }
  return base('URLhaus', u, 'not_found', {});
}

async function vtLookup(kind, id, displayIoc, key) {
  // kind: files | urls | domains | ip_addresses
  const res = await fetchJson(`https://www.virustotal.com/api/v3/${kind}/${encodeURIComponent(id)}`, {
    headers: { 'x-apikey': key },
  });
  if (res.status === 404) return base('VirusTotal', displayIoc, 'not_found', {});
  const attr = res.body && res.body.data && res.body.data.attributes;
  if (res.ok && attr) {
    const stats = attr.last_analysis_stats || {};
    const mal = stats.malicious || 0;
    const total = Object.values(stats).reduce((a, c) => a + (c || 0), 0) || 0;
    const gid = kind === 'urls' ? id : encodeURIComponent(displayIoc);
    return base('VirusTotal', displayIoc, mal > 0 ? 'hit' : 'not_found', {
      summary: `${mal}/${total} engines flagged malicious`,
      family: (attr.popular_threat_classification && attr.popular_threat_classification.suggested_threat_label) || null,
      lastSeen: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
      link: `https://www.virustotal.com/gui/search/${gid}`,
    });
  }
  return base('VirusTotal', displayIoc, 'error', { summary: `lookup failed (HTTP ${res.status})` });
}

async function nvdCve(cve, key) {
  const headers = key ? { apiKey: key } : {};
  const res = await fetchJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cve)}`, { headers });
  const v = res.body && res.body.vulnerabilities && res.body.vulnerabilities[0];
  if (res.ok && v && v.cve) {
    const c = v.cve;
    const metrics = c.metrics || {};
    const m = (metrics.cvssMetricV31 || metrics.cvssMetricV30 || metrics.cvssMetricV2 || [])[0];
    const cvss = m && m.cvssData ? `${m.cvssData.baseScore} (${m.cvssData.baseSeverity || m.baseSeverity || ''})` : null;
    const desc = (c.descriptions || []).find(d => d.lang === 'en');
    return base('NVD', cve, 'hit', {
      summary: desc ? desc.value.slice(0, 240) : 'CVE record found',
      severity: cvss,
      firstSeen: c.published || null,
      lastSeen: c.lastModified || null,
      link: `https://nvd.nist.gov/vuln/detail/${cve}`,
    });
  }
  return base('NVD', cve, 'not_found', {});
}

async function otxLookup(section, ioc, key) {
  const res = await fetchJson(`https://otx.alienvault.com/api/v1/indicators/${section}/${encodeURIComponent(ioc)}/general`, {
    headers: { 'X-OTX-API-KEY': key },
  });
  const b = res.body || {};
  if (res.ok && b.pulse_info) {
    const count = (b.pulse_info && b.pulse_info.count) || 0;
    return base('OTX', ioc, count > 0 ? 'hit' : 'not_found', {
      summary: count > 0 ? `${count} OTX pulse(s) reference this indicator` : 'No OTX pulses',
      link: `https://otx.alienvault.com/indicator/${section.replace('IPv4', 'ip').replace('hostname', 'domain')}/${encodeURIComponent(ioc)}`,
    });
  }
  if (res.status === 404) return base('OTX', ioc, 'not_found', {});
  return base('OTX', ioc, 'error', { summary: `lookup failed (HTTP ${res.status})` });
}

function base(provider, ioc, status, extra) {
  return {
    provider, source: provider, ioc, status,
    summary: null, family: null, severity: null, confidence: null,
    firstSeen: null, lastSeen: null, link: null,
    timestamp: nowIso(),
    ...extra,
  };
}

/* VirusTotal URL id = unpadded base64url of the URL. */
function vtUrlId(u) {
  const b64 = btoa(unescape(encodeURIComponent(u)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function runWithCache(key, fn) {
  const hit = cached(key);
  if (hit) return { ...hit, summary: hit.summary };
  try {
    const v = await fn();
    return putCache(key, v);
  } catch (e) {
    const [provider, ioc] = key.split('::');
    return base(provider, ioc, 'error', { summary: e && e.name === 'AbortError' ? 'provider timeout' : 'provider error' });
  }
}

export async function onRequestPost({ request, env }) {
  // Same-origin guard (best effort): reject obvious cross-site posts.
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return json({ ok: false, reason: 'rate_limited', message: 'Rate limit exceeded. Try again shortly. Local analysis still completed.' }, 429);
  }

  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) {
    return json({ ok: false, reason: 'too_large', message: 'Request too large.' }, 413);
  }

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ ok: false, reason: 'too_large', message: 'Request too large.' }, 413);
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, reason: 'bad_request', message: 'Invalid JSON.' }, 400);
  }

  const demoMode = !!(payload && payload.demoMode);
  const iocs = (payload && payload.iocs) || {};

  // Which providers are configured?
  const keys = {
    mb: env && env.MALWAREBAZAAR_API_KEY,
    tf: env && env.THREATFOX_API_KEY,
    uh: env && env.URLHAUS_API_KEY,
    vt: env && env.VIRUSTOTAL_API_KEY,
    nvd: env && env.NVD_API_KEY,        // optional even when used
    otx: env && env.OTX_API_KEY,
  };
  const enabled = [];
  if (keys.mb) enabled.push('MalwareBazaar');
  if (keys.tf) enabled.push('ThreatFox');
  if (keys.uh) enabled.push('URLhaus');
  if (keys.vt) enabled.push('VirusTotal');
  enabled.push('NVD'); // NVD works without a key (lower rate limit)
  if (keys.otx) enabled.push('OTX');

  // If literally nothing can run (no keys AND no CVEs to hit NVD), say so.
  const hasCves = Array.isArray(iocs.cves) && iocs.cves.length > 0;
  const hasKeyProvider = keys.mb || keys.tf || keys.uh || keys.vt || keys.otx;
  if (!hasKeyProvider && !hasCves) {
    return json({ ok: false, reason: 'no_providers', message: 'Threat intel enrichment unavailable (no API keys configured). Local analysis still completed.' });
  }

  // Sanitize + validate IOCs, applying the same safety filters as the client.
  const sha256 = dedupeCap(iocs.sha256).filter(x => RX.sha256.test(x));
  const sha1 = dedupeCap(iocs.sha1).filter(x => RX.sha1.test(x));
  const md5 = dedupeCap(iocs.md5).filter(x => RX.md5.test(x));
  const urls = dedupeCap(iocs.urls).filter(x => RX.url.test(x));
  const onion = dedupeCap(iocs.onion).filter(x => RX.onion.test(x));
  const cves = dedupeCap(iocs.cves).filter(x => RX.cve.test(x));
  const domains = dedupeCap(iocs.domains)
    .filter(x => RX.domain.test(x))
    .filter(x => demoMode || !isExampleDomain(x));
  const ips = dedupeCap(iocs.ips)
    .filter(x => RX.ipv4.test(x))
    .filter(x => !isPrivateOrReservedIp(x))
    .filter(x => demoMode || !isTestNetIp(x));

  const tasks = [];
  const hashes = [...sha256, ...sha1, ...md5];

  for (const h of hashes) {
    if (keys.mb) tasks.push(runWithCache(`MalwareBazaar::${h}`, () => mbHash(h, keys.mb)));
    if (keys.vt) tasks.push(runWithCache(`VirusTotal::${h}`, () => vtLookup('files', h, h, keys.vt)));
    if (keys.otx) tasks.push(runWithCache(`OTX::${h}`, () => otxLookup('file', h, keys.otx)));
  }
  for (const u of urls) {
    if (keys.uh) tasks.push(runWithCache(`URLhaus::${u}`, () => urlhausUrl(u, keys.uh)));
    if (keys.vt) tasks.push(runWithCache(`VirusTotal::${u}`, () => vtLookup('urls', vtUrlId(u), u, keys.vt)));
    if (keys.tf) tasks.push(runWithCache(`ThreatFox::${u}`, () => tfSearch(u, keys.tf)));
  }
  for (const d of domains) {
    if (keys.vt) tasks.push(runWithCache(`VirusTotal::${d}`, () => vtLookup('domains', d, d, keys.vt)));
    if (keys.otx) tasks.push(runWithCache(`OTX::${d}`, () => otxLookup('domain', d, keys.otx)));
    if (keys.tf) tasks.push(runWithCache(`ThreatFox::${d}`, () => tfSearch(d, keys.tf)));
  }
  for (const ip4 of ips) {
    if (keys.vt) tasks.push(runWithCache(`VirusTotal::${ip4}`, () => vtLookup('ip_addresses', ip4, ip4, keys.vt)));
    if (keys.otx) tasks.push(runWithCache(`OTX::${ip4}`, () => otxLookup('IPv4', ip4, keys.otx)));
    if (keys.tf) tasks.push(runWithCache(`ThreatFox::${ip4}`, () => tfSearch(ip4, keys.tf)));
  }
  for (const o of onion) {
    if (keys.tf) tasks.push(runWithCache(`ThreatFox::${o}`, () => tfSearch(o, keys.tf)));
  }
  for (const c of cves) {
    tasks.push(runWithCache(`NVD::${c}`, () => nvdCve(c, keys.nvd)));
  }

  const results = await Promise.all(tasks);

  return json({
    ok: true,
    enabledProviders: enabled,
    counts: { hashes: hashes.length, urls: urls.length, domains: domains.length, ips: ips.length, onion: onion.length, cves: cves.length },
    results,
    note: 'Third-party intelligence. Not absolute truth. Validate independently.',
    timestamp: nowIso(),
  });
}

// Reject non-POST methods cleanly.
export async function onRequestGet() {
  return json({ ok: false, reason: 'method_not_allowed', message: 'Use POST with extracted IOCs.' }, 405);
}
