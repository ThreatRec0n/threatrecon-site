import { memoryCache } from './memory-cache';

/**
 * Stale-While-Revalidate cache pattern
 * Returns cached data immediately, revalidates in background if stale
 */
export async function fetchWithSWR<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T> {
  // Check cache
  const cached = memoryCache.get<T>(cacheKey);

  if (cached) {
    // Return cached data immediately
    // Revalidate in background if stale (after half TTL)
    const entry = (memoryCache as any).cache?.get(cacheKey);
    if (entry && Date.now() - entry.timestamp > ttl / 2) {
      // Revalidate in background (don't await)
      fetcher().then(data => {
        memoryCache.set(cacheKey, data, ttl);
      }).catch(console.error);
    }

    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  memoryCache.set(cacheKey, data, ttl);
  return data;
}

