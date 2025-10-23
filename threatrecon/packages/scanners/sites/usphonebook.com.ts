import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'usphonebook.com',
  supportsInputTypes: ['phone','name','address'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.usphonebook.com/opt-out', lastChecked: new Date().toISOString() },
  async buildQueries(input) {
    const q: { url: string }[] = [];
    if (input.phone) q.push({ url: `https://www.usphonebook.com/${encodeURIComponent(input.phone.replace(/\D/g,''))}` });
    return q;
  },
  async parse(html) {
    const out: any[] = [];
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
    if (canonical) out.push({ url: canonical[1] });
    return out;
  },
  match(c, input) { return { matched: !!c.url, matchedFields: [input.type], reason: 'Canonical profile URL found', confidence: 0.4 }; }
};
export default adapter;
