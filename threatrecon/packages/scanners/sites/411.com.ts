import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: '411.com',
  supportsInputTypes: ['name','phone','address'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.whitepages.com/suppression_requests', lastChecked: new Date().toISOString(), mirrorOf: 'whitepages.com' },
  async buildQueries() { return []; },
  async parse() { return []; },
  match() { return { matched: false, matchedFields: [], reason: 'Mirror to whitepages; soft result', confidence: 0 }; }
};
export default adapter;
