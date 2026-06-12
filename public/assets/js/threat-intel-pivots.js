/* =====================================================================
   ThreatRecon threat-intelligence pivots
   Builds manual external lookup URLs only. No fetch, XHR, beacons, API
   keys, uploads, or automatic third-party submissions are used here.
   ===================================================================== */

export const THREAT_INTEL_PIVOT_NOTE = 'Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.';
export const THREAT_INTEL_PIVOT_PRIVACY_NOTE = 'ThreatRecon does not automatically submit IOCs or samples. These links open external services only when clicked.';
export const NON_ACTIONABLE_PIVOT_REASON = 'Not pivoted by default: private, reserved, documentation, resolver, or training indicator.';

export const PIVOT_PROVIDERS = {
  virustotal: { id: 'virustotal', name: 'VirusTotal', shortName: 'VT' },
  malwarebazaar: { id: 'malwarebazaar', name: 'MalwareBazaar', shortName: 'MalwareBazaar' },
  urlhaus: { id: 'urlhaus', name: 'URLhaus', shortName: 'URLhaus' },
  otx: { id: 'otx', name: 'AlienVault OTX', shortName: 'OTX' },
  threatfox: { id: 'threatfox', name: 'ThreatFox', shortName: 'ThreatFox' },
  abuseipdb: { id: 'abuseipdb', name: 'AbuseIPDB', shortName: 'AbuseIPDB' },
  greynoise: { id: 'greynoise', name: 'GreyNoise Community', shortName: 'GreyNoise' },
};

const HASH_TYPES = new Set(['md5', 'sha1', 'sha256', 'hash']);
const CONTEXT_PIVOT_TYPES = new Set(['email', 'registry_key', 'file_path', 'mutex']);
const NON_ACTIONABLE_CONTEXT_RX = /private|reserved|documentation|resolver|training|demo|local|loopback|test/i;

function detectHashType(value) {
  const v = String(value || '').trim();
  if (/^[a-f0-9]{32}$/i.test(v)) return 'md5';
  if (/^[a-f0-9]{40}$/i.test(v)) return 'sha1';
  if (/^[a-f0-9]{64}$/i.test(v)) return 'sha256';
  return null;
}

function canonicalType(type, value) {
  const t = String(type || 'other').trim().toLowerCase();
  if (t === 'ipv4' || t === 'ipv6') return 'ip';
  if (t === 'registry') return 'registry_key';
  if (t === 'filepath') return 'file_path';
  if (HASH_TYPES.has(t)) return detectHashType(value) || (t === 'hash' ? 'hash' : t);
  if (['ip', 'domain', 'url', 'email', 'registry_key', 'file_path', 'mutex'].includes(t)) return t;
  return detectHashType(value) || 'other';
}

export function refangIocForPivot(value) {
  let out = String(value || '').trim();
  out = out.replace(/^hxxps/i, 'https').replace(/^hxxp/i, 'http');
  out = out.replace(/\[\.]|\(\.\)/g, '.');
  out = out.replace(/\[:\/\/\]/g, '://');
  out = out.replace(/\[:\]/g, ':');
  return out;
}

export function encodePivotValue(value) {
  return encodeURIComponent(String(value || '').trim());
}

export function normalizeIocForPivot(ioc, type = 'other') {
  const original = String(ioc || '').trim();
  const refangedValue = refangIocForPivot(original);
  const normalizedType = canonicalType(type, refangedValue);
  let normalizedValue = refangedValue;
  if (normalizedType === 'domain' || normalizedType === 'email' || normalizedType === 'ip' || HASH_TYPES.has(normalizedType)) {
    normalizedValue = refangedValue.toLowerCase();
  }
  return {
    original,
    normalizedValue,
    refangedValue,
    type: normalizedType,
    refanged: original !== refangedValue,
  };
}

function providerIdsForType(type) {
  if (HASH_TYPES.has(type)) return ['virustotal', 'malwarebazaar', 'threatfox', 'otx'];
  if (type === 'domain') return ['virustotal', 'urlhaus', 'threatfox', 'otx'];
  if (type === 'url') return ['virustotal', 'urlhaus', 'otx', 'threatfox'];
  if (type === 'ip') return ['virustotal', 'otx', 'abuseipdb', 'greynoise', 'threatfox'];
  if (type === 'email') return ['otx', 'virustotal'];
  if (type === 'registry_key' || type === 'file_path' || type === 'mutex' || type === 'other') return ['virustotal', 'otx'];
  return [];
}

function shouldBuildPivots(type, actionable, reason) {
  if (actionable) return true;
  if (CONTEXT_PIVOT_TYPES.has(type) && !NON_ACTIONABLE_CONTEXT_RX.test(String(reason || ''))) return true;
  return false;
}

function malwareBazaarUrl(value, type) {
  const hashType = detectHashType(value) || (HASH_TYPES.has(type) ? type : 'hash');
  const search = hashType === 'hash' ? value : `${hashType}:${value}`;
  return `https://bazaar.abuse.ch/browse.php?search=${encodePivotValue(search)}`;
}

function otxIndicatorUrl(value, type) {
  const encoded = encodePivotValue(value);
  if (HASH_TYPES.has(type)) return `https://otx.alienvault.com/indicator/file/${encoded}`;
  if (type === 'domain') return `https://otx.alienvault.com/indicator/domain/${encoded}`;
  if (type === 'url') return `https://otx.alienvault.com/indicator/url/${encoded}`;
  if (type === 'ip') return value.includes(':')
    ? `https://otx.alienvault.com/indicator/IPv6/${encoded}`
    : `https://otx.alienvault.com/indicator/IPv4/${encoded}`;
  return `https://otx.alienvault.com/browse/global/?q=${encoded}`;
}

export function getPivotProviderUrl(provider, value, type = 'other') {
  const providerId = String(provider || '').toLowerCase();
  const normalizedType = canonicalType(type, value);
  const encoded = encodePivotValue(value);

  if (providerId === 'virustotal') return `https://www.virustotal.com/gui/search/${encoded}`;
  if (providerId === 'malwarebazaar' && HASH_TYPES.has(normalizedType)) return malwareBazaarUrl(value, normalizedType);
  if (providerId === 'urlhaus' && (normalizedType === 'url' || normalizedType === 'domain')) return `https://urlhaus.abuse.ch/browse.php?search=${encoded}`;
  if (providerId === 'otx') return otxIndicatorUrl(value, normalizedType);
  if (providerId === 'threatfox' && ['md5', 'sha1', 'sha256', 'hash', 'domain', 'url', 'ip'].includes(normalizedType)) return `https://threatfox.abuse.ch/browse.php?search=${encoded}`;
  if (providerId === 'abuseipdb' && normalizedType === 'ip') return `https://www.abuseipdb.com/check/${encoded}`;
  if (providerId === 'greynoise' && normalizedType === 'ip') return `https://viz.greynoise.io/ip/${encoded}`;
  return null;
}

export function buildThreatIntelPivots(ioc, type = 'other', options = {}) {
  const normalized = normalizeIocForPivot(ioc, type);
  const actionable = options.actionable !== false;
  const reason = options.reason || '';
  if (!normalized.original || !shouldBuildPivots(normalized.type, actionable, reason)) return [];

  const seen = new Set();
  return providerIdsForType(normalized.type).reduce((links, providerId) => {
    const url = getPivotProviderUrl(providerId, normalized.normalizedValue, normalized.type);
    if (!url || seen.has(providerId + '|' + url)) return links;
    seen.add(providerId + '|' + url);
    const provider = PIVOT_PROVIDERS[providerId];
    links.push({
      provider: provider.name,
      providerId,
      shortName: provider.shortName,
      url,
      title: `Search this ${normalized.type.replace('_', ' ')} on ${provider.name}`,
      ariaLabel: `Search this ${normalized.type.replace('_', ' ')} on ${provider.name}`,
      note: THREAT_INTEL_PIVOT_NOTE,
    });
    return links;
  }, []);
}

function pivotCategory(type) {
  if (HASH_TYPES.has(type)) return 'Hashes';
  if (type === 'url') return 'URLs';
  if (type === 'domain') return 'Domains';
  if (type === 'ip') return 'IP Addresses';
  return 'Other Indicators';
}

export function buildThreatIntelPivotRows(iocActionability = []) {
  const rows = [];
  const seenRows = new Set();
  (iocActionability || []).forEach(row => {
    const normalized = normalizeIocForPivot(row.value, row.type);
    if (!normalized.original) return;
    const dedupeKey = `${normalized.type}|${normalized.normalizedValue}`;
    if (seenRows.has(dedupeKey)) return;
    seenRows.add(dedupeKey);

    const pivots = buildThreatIntelPivots(row.value, row.type, {
      actionable: row.actionable,
      reason: row.reason,
    });
    rows.push({
      ioc: row.value,
      originalValue: row.value,
      normalizedValue: normalized.normalizedValue,
      type: normalized.type,
      category: pivotCategory(normalized.type),
      actionable: row.actionable === true,
      actionabilityReason: row.reason || '',
      recommendedAction: row.recommendedAction || '',
      refanged: normalized.refanged,
      refangNote: normalized.refanged ? 'Search uses refanged value for external lookup.' : '',
      pivots,
      nonPivotReason: pivots.length ? '' : NON_ACTIONABLE_PIVOT_REASON,
    });
  });
  return rows;
}

export function flattenThreatIntelPivots(rows = []) {
  const flattened = [];
  (rows || []).forEach(row => {
    if (!row.pivots || !row.pivots.length) {
      flattened.push({
        ioc: row.ioc,
        normalizedValue: row.normalizedValue,
        type: row.type,
        actionable: false,
        provider: null,
        url: null,
        note: row.nonPivotReason || NON_ACTIONABLE_PIVOT_REASON,
        reason: row.actionabilityReason || row.nonPivotReason || NON_ACTIONABLE_PIVOT_REASON,
      });
      return;
    }
    row.pivots.forEach(pivot => {
      flattened.push({
        ioc: row.ioc,
        normalizedValue: row.normalizedValue,
        type: row.type,
        actionable: row.actionable,
        provider: pivot.provider,
        url: pivot.url,
        note: pivot.note,
        reason: row.actionabilityReason || '',
      });
    });
  });
  return flattened;
}
