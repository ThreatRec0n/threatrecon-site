import type { SiteAdapter } from '@/lib/types';
const adapter: SiteAdapter = {
  id: 'peoplesearchexpert.com',
  supportsInputTypes: ['name','email','phone','address','username'],
  metadata: { robotsStatus: 'unknown', optOutUrl: '', lastChecked: new Date().toISOString() },
  async buildQueries(input) { return []; },
  async parse(html, url) { return []; },
  match(candidate, input) { return { matched: false, matchedFields: [], reason: 'Stub adapter', confidence: 0 }; }
};
export default adapter;
