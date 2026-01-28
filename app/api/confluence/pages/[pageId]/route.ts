import { NextResponse } from 'next/server';
import { getPage } from '@/lib/exporters/confluence/api';

/**
 * GET /api/confluence/pages/[pageId]
 * Get a single Confluence page with full body content
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const page = await getPage(pageId);

    // Extract parent ID from ancestors
    const parentId = page.ancestors && page.ancestors.length > 0
      ? page.ancestors[page.ancestors.length - 1].id
      : null;

    const createdAt = page.version?.when || null;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API /pages/${pageId}] Returning page: ${page.title}`);
    }

    return NextResponse.json(
      {
        id: page.id,
        title: page.title,
        status: page.status,
        parentId,
        createdAt,
        body: page.body?.storage?.value || '',
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('[API /pages/[pageId]] Failed to fetch page:', error);

    return NextResponse.json(
      { error: 'Failed to fetch page', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
