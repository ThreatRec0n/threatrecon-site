/* =====================================================================
   ThreatRecon threat-intelligence pivots
   Builds manual external lookup URLs only. No fetch, XHR, beacons, API
   keys, uploads, or automatic third-party submissions are used here.
   ===================================================================== */

export const THREAT_INTEL_PIVOT_NOTE = 'Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.';
export const THREAT_INTEL_PIVOT_PRIVACY_NOTE = 'ThreatRecon does not automatically submit IOCs or samples. These links open external services only when clicked.';
export const NON_ACTIONABLE_PIVOT_REASON = 'Skipped from reputation pivots: private, reserved, documentation, resolver, demo, malformed, or training value.';
export const SKIPPED_PIVOT_SECTION_NOTE = 'These indicators were extracted for analyst context but are not shown as reputation pivots because they are private, reserved, documentation, resolver, demo, malformed, or training values.';

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
const RESERVED_SINGLE_LABELS = new Set(['test', 'demo', 'sample', 'localhost', 'local', 'localdomain', 'training']);
const RESERVED_DOMAIN_SUFFIXES = ['.test', '.invalid', '.localhost', '.example', '.local', '.lan', '.home', '.internal', '.corp', '.domain'];
const RESERVED_DEMO_DOMAINS = ['example.com', 'example.org', 'example.net', 'example.edu'];
const KNOWN_PUBLIC_RESOLVERS = new Set(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112', '208.67.222.222', '208.67.220.220']);

function detectHashType(value) {
  const v = String(value || '').trim();
  if (/^[a-f0-9]{32}$/i.test(v)) return 'md5';
  if (/^[a-f0-9]{40}$/i.test(v)) return 'sha1';
  if (/^[a-f0-9]{64}$/i.test(v)) return 'sha256';
  return null;
}

function canonicalType(type, value) {
  const t = String(type || 'other').trim().toLowerCase();
  if (t === 'ipv4' || t === 'ipv6' || t === 'local_ip') return 'ip';
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

function ipv4Parts(value) {
  const m = String(value || '').match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255) ? parts : null;
}

function isPrivateReservedIpv4(value) {
  const parts = ipv4Parts(value);
  if (!parts) return false;
  const [a, b, c, d] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224 && a <= 239) return true;
  if (a >= 240 && a <= 255) return true;
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;
  return false;
}

function isDocumentationIpv4(value) {
  const parts = ipv4Parts(value);
  if (!parts) return false;
  const [a, b, c] = parts;
  return (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113);
}

function isReservedIpv6(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') ||
    v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') ||
    v.startsWith('ff') || v.startsWith('2001:db8:') || v === '2001:db8::';
}

function hostFromValue(value) {
  const raw = refangIocForPivot(value).toLowerCase().replace(/\.$/, '');
  if (!raw) return '';
  try {
    return new URL(raw).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return raw.replace(/^\[|\]$/g, '').split('/')[0].split(':')[0].replace(/\.$/, '');
  }
}

function isReservedDomainHost(host) {
  const h = String(host || '').trim().toLowerCase().replace(/\.$/, '');
  if (!h) return false;
  if (RESERVED_SINGLE_LABELS.has(h)) return true;
  if (/(^|[.-])(demo|training|sample)([.-]|$)/.test(h)) return true;
  if (RESERVED_DEMO_DOMAINS.some(d => h === d || h.endsWith(`.${d}`))) return true;
  return RESERVED_DOMAIN_SUFFIXES.some(suffix => h.endsWith(suffix));
}

function categoryFromReason(reason, type = 'other') {
  const r = String(reason || '').toLowerCase();
  if (/resolver/.test(r)) return { category: 'known-resolver', reason: 'Skipped: known public resolver' };
  if (/documentation/.test(r) && type === 'ip') return { category: 'documentation-ip', reason: 'Skipped: documentation IP range' };
  if (/reserved|test|documentation/.test(r) && (type === 'domain' || type === 'url')) return { category: 'reserved-domain', reason: 'Skipped: reserved domain' };
  if (/private|local|loopback|special/.test(r)) return { category: 'private-local', reason: 'Skipped: private/local indicator' };
  if (/demo|training/.test(r)) return { category: 'training-demo', reason: 'Skipped: training/demo indicator' };
  return { category: 'not-suitable', reason: 'Skipped: not suitable for reputation pivot' };
}

export function classifyPivotActionability(ioc, type = 'other', options = {}) {
  const normalized = normalizeIocForPivot(ioc, type);
  if (!normalized.original) {
    return { actionable: false, reason: 'Skipped: invalid or non-routable indicator', category: 'invalid' };
  }

  if (HASH_TYPES.has(normalized.type)) {
    if (options.actionable === false) {
      const classified = categoryFromReason(options.reason, normalized.type);
      return { actionable: false, reason: classified.reason, category: classified.category };
    }
    return detectHashType(normalized.normalizedValue)
      ? { actionable: true, reason: 'Actionable public IOC', category: 'actionable' }
      : { actionable: false, reason: 'Skipped: invalid or non-routable indicator', category: 'invalid' };
  }

  if (normalized.type === 'ip') {
    const value = normalized.normalizedValue;
    if (KNOWN_PUBLIC_RESOLVERS.has(value)) return { actionable: false, reason: 'Skipped: known public resolver', category: 'known-resolver' };
    if (isDocumentationIpv4(value)) return { actionable: false, reason: 'Skipped: documentation IP range', category: 'documentation-ip' };
    if (isPrivateReservedIpv4(value) || isReservedIpv6(value)) return { actionable: false, reason: 'Skipped: private IP', category: 'private-ip' };
    if (!ipv4Parts(value) && !value.includes(':')) return { actionable: false, reason: 'Skipped: invalid or non-routable indicator', category: 'invalid' };
    if (options.actionable === false) {
      const classified = categoryFromReason(options.reason, normalized.type);
      return { actionable: false, reason: classified.reason, category: classified.category };
    }
    return { actionable: true, reason: 'Actionable public IOC', category: 'actionable' };
  }

  if (normalized.type === 'domain' || normalized.type === 'url') {
    const host = normalized.type === 'url' ? hostFromValue(normalized.normalizedValue) : normalized.normalizedValue;
    if (KNOWN_PUBLIC_RESOLVERS.has(host)) return { actionable: false, reason: 'Skipped: known public resolver', category: 'known-resolver' };
    if (isDocumentationIpv4(host)) return { actionable: false, reason: 'Skipped: documentation IP range', category: 'documentation-ip' };
    if (isPrivateReservedIpv4(host) || isReservedIpv6(host)) return { actionable: false, reason: 'Skipped: private IP', category: 'private-ip' };
    if (isReservedDomainHost(host)) return { actionable: false, reason: 'Skipped: reserved domain', category: 'reserved-domain' };
    if (!host || (!host.includes('.') && !host.includes(':'))) return { actionable: false, reason: 'Skipped: invalid or non-routable indicator', category: 'invalid' };
    if (options.actionable === false) {
      const classified = categoryFromReason(options.reason, normalized.type);
      return { actionable: false, reason: classified.reason, category: classified.category };
    }
    return { actionable: true, reason: 'Actionable public IOC', category: 'actionable' };
  }

  if (normalized.type === 'email' || normalized.type === 'registry_key' || normalized.type === 'file_path' || normalized.type === 'mutex') {
    return { actionable: false, reason: 'Skipped: not suitable for reputation pivot', category: 'not-suitable' };
  }

  if (RESERVED_SINGLE_LABELS.has(normalized.normalizedValue.toLowerCase())) {
    return { actionable: false, reason: 'Skipped: training/demo indicator', category: 'training-demo' };
  }

  return { actionable: false, reason: 'Skipped: invalid or non-routable indicator', category: 'invalid' };
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
  const actionability = classifyPivotActionability(ioc, type, options);
  if (!normalized.original || !actionability.actionable) return [];

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

    const pivotActionability = classifyPivotActionability(row.value, row.type, {
      actionable: row.actionable,
      reason: row.reason,
    });
    const pivots = buildThreatIntelPivots(row.value, row.type, pivotActionability);
    rows.push({
      ioc: row.value,
      originalValue: row.value,
      normalizedValue: normalized.normalizedValue,
      type: normalized.type,
      category: pivotCategory(normalized.type),
      actionable: pivotActionability.actionable,
      pivotActionability,
      actionabilityReason: row.reason || '',
      recommendedAction: row.recommendedAction || '',
      refanged: normalized.refanged,
      refangNote: normalized.refanged ? 'Search uses refanged value for external lookup.' : '',
      pivots,
      nonPivotReason: pivots.length ? '' : pivotActionability.reason,
      skipCategory: pivots.length ? '' : pivotActionability.category,
    });
  });
  return rows;
}

export function flattenThreatIntelPivots(rows = []) {
  const flattened = [];
  (rows || []).forEach(row => {
    if (!row.pivots || !row.pivots.length) return;
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

export function flattenSkippedThreatIntelPivots(rows = []) {
  return (rows || [])
    .filter(row => !row.pivots || !row.pivots.length)
    .map(row => ({
      ioc: row.ioc,
      normalizedValue: row.normalizedValue,
      type: row.type,
      actionable: false,
      reason: row.nonPivotReason || NON_ACTIONABLE_PIVOT_REASON,
      category: row.skipCategory || 'not-suitable',
    }));
}
