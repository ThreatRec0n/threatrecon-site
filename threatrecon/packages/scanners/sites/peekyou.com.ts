import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'peekyou.com',
  supportsInputTypes: ['name','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.peekyou.com/about/contact/optout', lastChecked: new Date().toISOString() },
  async buildQueries(input) {
    const q: { url: string }[] = [];
    if (input.username) q.push({ url: `https://www.peekyou.com/${encodeURIComponent(input.username)}` });
    if (input.fullName) q.push({ url: `https://www.peekyou.com/usa/${encodeURIComponent(input.fullName.replace(/\s+/g,'_'))}` });
    return q;
  },
  async parse(html) {
    const out: any[] = [];
    const profile = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)/i);
    if (profile) out.push({ url: profile[1] });
    return out;
  },
  match(c, input) { return { matched: !!c.url, matchedFields: [input.type], reason: 'Profile URL detected', confidence: 0.4 }; }
};
export default adapter;
