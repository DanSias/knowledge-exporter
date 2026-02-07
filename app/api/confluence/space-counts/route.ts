import { NextResponse } from 'next/server';
import { checkConfluenceEnv } from '@/lib/env';
import { getSpacePageCount } from '@/lib/exporters/confluence/api';

// Simple in-memory cache for space counts
// Cache key: sorted comma-separated space keys
// Cache value: { counts, timestamp }
const cache = new Map<string, { counts: Record<string, number | undefined>; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Periodic cache cleanup (run every 15 minutes)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[space-counts] Cleaned ${cleaned} expired cache entries`);
  }
}, 15 * 60 * 1000);

/**
 * Generate a cache key from space keys
 */
function getCacheKey(spaceKeys: string[]): string {
  return [...spaceKeys].sort().join(',');
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * POST /api/confluence/space-counts
 * Get page counts for multiple spaces
 * Body: { spaceKeys: string[] }
 *
 * Features:
 * - Batched requests (5 concurrent max)
 * - In-memory cache (10 minute TTL)
 * - Returns undefined for failed requests (UI shows "—")
 */
export async function POST(request: Request) {
  try {
    // Check environment configuration
    const envConfig = checkConfluenceEnv();

    if (!envConfig.hasSite || !envConfig.hasEmail || !envConfig.hasApiToken) {
      return NextResponse.json(
        { error: 'Missing Confluence environment variables' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { spaceKeys } = body;

    if (!spaceKeys || !Array.isArray(spaceKeys)) {
      return NextResponse.json(
        { error: 'spaceKeys must be an array' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(spaceKeys);
    const cached = cache.get(cacheKey);

    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`[space-counts] Cache hit for ${spaceKeys.length} spaces`);
      return NextResponse.json({ counts: cached.counts });
    }

    console.log(`[space-counts] Cache miss, fetching counts for ${spaceKeys.length} spaces`);

    // Fetch counts in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 5;
    const counts: Record<string, number | undefined> = {};

    // Process in batches
    for (let i = 0; i < spaceKeys.length; i += CONCURRENCY_LIMIT) {
      const batch = spaceKeys.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async (spaceKey) => {
          try {
            const count = await getSpacePageCount(spaceKey);
            // Return the count (0 means empty space, which is valid)
            return { spaceKey, count };
          } catch (error) {
            console.error(`Failed to get count for space ${spaceKey}:`, error);
            // Return undefined for errors (UI will show "—")
            return { spaceKey, count: undefined };
          }
        })
      );

      // Add to counts object
      batchResults.forEach(({ spaceKey, count }) => {
        counts[spaceKey] = count;
      });
    }

    // Store in cache
    cache.set(cacheKey, {
      counts,
      timestamp: Date.now(),
    });

    console.log(`[space-counts] Cached results for ${spaceKeys.length} spaces`);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Space counts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch space counts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
