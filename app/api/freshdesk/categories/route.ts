import { NextResponse } from 'next/server';
import { listCategories } from '@/lib/exporters/freshdesk/api';

/**
 * GET /api/freshdesk/categories
 * List all Freshdesk solution categories
 */
export async function GET() {
  try {
    const categories = await listCategories();

    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);

    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
