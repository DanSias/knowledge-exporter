import { NextResponse } from 'next/server';
import { listSpaces } from '@/lib/exporters/confluence/api';

/**
 * GET /api/confluence/spaces
 * List all Confluence spaces
 */
export async function GET() {
  try {
    const spaces = await listSpaces();

    return NextResponse.json(
      spaces.map((space) => ({
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        status: space.status,
      })),
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Failed to fetch spaces:', error);

    return NextResponse.json(
      { error: 'Failed to fetch spaces', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
