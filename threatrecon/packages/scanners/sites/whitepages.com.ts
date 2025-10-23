import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'whitepages.com',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.whitepages.com/suppression_requests', lastChecked: new Date().toISOString() },
  async buildQueries() {
    // Whitepages actively blocks automated access and requires JS; provide soft result
    return [];
  },
  async parse() { return []; },
  match() { return { matched: false, matchedFields: [], reason: 'Automated access disallowed; soft result only', confidence: 0 }; }
};
export default adapter;
