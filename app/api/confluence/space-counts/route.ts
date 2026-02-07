import { NextResponse } from 'next/server';
import { checkConfluenceEnv } from '@/lib/env';
import { getSpacePageCount } from '@/lib/exporters/confluence/api';

/**
 * POST /api/confluence/space-counts
 * Get page counts for multiple spaces
 * Body: { spaceKeys: string[] }
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

    // Fetch counts in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 5;
    const counts: Record<string, number> = {};

    // Process in batches
    for (let i = 0; i < spaceKeys.length; i += CONCURRENCY_LIMIT) {
      const batch = spaceKeys.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map(async (spaceKey) => {
          try {
            const count = await getSpacePageCount(spaceKey);
            return { spaceKey, count };
          } catch (error) {
            console.error(`Failed to get count for space ${spaceKey}:`, error);
            return { spaceKey, count: 0 };
          }
        })
      );

      // Add to counts object
      batchResults.forEach(({ spaceKey, count }) => {
        counts[spaceKey] = count;
      });
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Space counts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch space counts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
