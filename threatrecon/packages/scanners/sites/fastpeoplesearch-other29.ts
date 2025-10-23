import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'fastpeoplesearch-other29',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: 'https://www.fastpeoplesearch.com/remove', lastChecked: new Date().toISOString(), mirrorOf: 'fastpeoplesearch.com' },
  async buildQueries(input) { return []; },
  async parse(html, url) { return []; },
  match(candidate, input) { return { matched: false, matchedFields: [], reason: 'Stub adapter', confidence: 0 }; }
};
export default adapter;
