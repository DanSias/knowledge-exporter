import { NextResponse } from 'next/server';
import { listFolders } from '@/lib/exporters/freshdesk/api';

interface RouteContext {
  params: Promise<{ categoryId: string }>;
}

/**
 * GET /api/freshdesk/categories/:categoryId/folders
 * List folders in a Freshdesk category
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { categoryId } = await context.params;
    const categoryIdNum = parseInt(categoryId, 10);

    if (isNaN(categoryIdNum)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const folders = await listFolders(categoryIdNum);

    return NextResponse.json(folders, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch folders:', error);

    return NextResponse.json(
      { error: 'Failed to fetch folders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
