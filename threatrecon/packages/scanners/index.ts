import type { SiteAdapter } from '@/lib/types';

// Adapters registry will be populated by generator and manual imports
export const adapters: Record<string, SiteAdapter> = {};

export function registerAdapter(adapter: SiteAdapter) {
  adapters[adapter.id] = adapter;
}
