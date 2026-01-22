// Failsafe pattern for external calls
// Ensures demo never shows errors

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function withFailsafe<T>(
  key: string,
  action: () => Promise<T>,
  fallback: T
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const result = await action();

    // Cache successful result
    cache.set(key, {
      data: result,
      timestamp: Date.now()
    });

    return { data: result, fromCache: false };
  } catch (error) {
    console.error(`Failsafe triggered for ${key}:`, error);

    // Try to return cached data
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for ${key}`);
      return { data: cached.data, fromCache: true };
    }

    // Return fallback
    console.log(`Returning fallback for ${key}`);
    return { data: fallback, fromCache: true };
  }
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
