import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'fastpeoplesearch.com',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.fastpeoplesearch.com/removal', lastChecked: new Date().toISOString() },
  async buildQueries() { return []; },
  async parse() { return []; },
  match() { return { matched: false, matchedFields: [], reason: 'Automated access disallowed; soft result only', confidence: 0 }; }
};
export default adapter;
