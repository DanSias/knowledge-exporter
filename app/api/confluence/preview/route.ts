import { NextResponse } from 'next/server';
import { checkConfluenceEnv } from '@/lib/env';
import { listSpaces } from '@/lib/exporters/confluence/api';

/**
 * GET /api/confluence/preview
 * Preview Confluence spaces for export
 */
export async function GET() {
  try {
    // Check environment configuration
    const envConfig = checkConfluenceEnv();

    if (!envConfig.hasSite || !envConfig.hasEmail || !envConfig.hasApiToken) {
      return NextResponse.json(
        {
          error: 'Missing Confluence environment variables',
          details: {
            hasSite: envConfig.hasSite,
            hasEmail: envConfig.hasEmail,
            hasApiToken: envConfig.hasApiToken,
          },
        },
        { status: 400 }
      );
    }

    // Fetch spaces
    const spaces = await listSpaces();

    // Return preview data
    return NextResponse.json(
      {
        site: envConfig.siteUrl,
        spaces: spaces.map((space) => ({
          id: space.id,
          key: space.key,
          name: space.name,
          type: space.type,
          status: space.status,
        })),
        totals: {
          spaceCount: spaces.length,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Confluence preview error:', error);

    // Check for auth errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Authentication failed', details: 'Invalid email or API token' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('403')) {
      return NextResponse.json(
        { error: 'Authorization failed', details: 'Insufficient permissions to access Confluence' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Confluence preview', details: errorMessage },
      { status: 500 }
    );
  }
}
