import type { SiteAdapter } from '@/lib/types';
import { normalizeEmail, normalizePhone, normalizeName } from '@/lib/normalizers';

const adapter: SiteAdapter = {
  id: 'thatsthem.com',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://thatsthem.com/optout', lastChecked: new Date().toISOString() },
  async buildQueries(input) {
    const queries: { url: string }[] = [];
    const base = 'https://thatsthem.com';
    if (input.email) {
      const email = encodeURIComponent(normalizeEmail(input.email)!);
      queries.push({ url: `${base}/email/${email}` });
    }
    if (input.phone) {
      const digits = normalizePhone(input.phone);
      if (digits) queries.push({ url: `${base}/phone/${encodeURIComponent(digits)}` });
    }
    if (input.fullName) {
      const name = encodeURIComponent(normalizeName(input.fullName)!);
      queries.push({ url: `${base}/name/${name}` });
    }
    return queries;
  },
  async parse(html: string, url: string) {
    const candidates: any[] = [];
    // Very light extraction: look for obvious canonical link to a profile
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    if (m) candidates.push({ url: m[1] });
    return candidates;
  },
  match(candidate, input) {
    // Since we do not parse details here, rely on overall matching with URL presence
    return { matched: !!candidate.url, matchedFields: [input.type], reason: 'Candidate link discovered', confidence: 0.4 };
  }
};
export default adapter;
import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'thatsthem.com',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: '', lastChecked: new Date().toISOString() },
  async buildQueries(input) { return []; },
  async parse(html, url) { return []; },
  match(candidate, input) { return { matched: false, matchedFields: [], reason: 'Stub adapter', confidence: 0 }; }
};
export default adapter;
