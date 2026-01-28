import { NextResponse } from 'next/server';
import { listPagesInSpace } from '@/lib/exporters/confluence/api';

/**
 * GET /api/confluence/spaces/[spaceKey]/pages
 * List pages in a Confluence space
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ spaceKey: string }> }
) {
  try {
    const { spaceKey } = await params;

    if (!spaceKey) {
      return NextResponse.json({ error: 'Space key is required' }, { status: 400 });
    }

    const pages = await listPagesInSpace(spaceKey);

    // Extract parent ID from ancestors array
    // The immediate parent is the last item in the ancestors array
    const pagesWithParentId = pages.map((page) => {
      const parentId = page.ancestors && page.ancestors.length > 0
        ? page.ancestors[page.ancestors.length - 1].id
        : null;

      return {
        id: page.id,
        title: page.title,
        status: page.status,
        parentId,
      };
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API /spaces/${spaceKey}/pages] Returning ${pagesWithParentId.length} pages`);
    }

    return NextResponse.json(
      {
        pages: pagesWithParentId,
        truncated: pages.length >= 500,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('[API /spaces/[spaceKey]/pages] Failed to fetch pages:', error);

    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
