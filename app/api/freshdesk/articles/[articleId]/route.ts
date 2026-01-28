import { NextResponse } from 'next/server';
import { freshdeskFetch } from '@/lib/exporters/freshdesk/client';

interface RouteContext {
  params: Promise<{ articleId: string }>;
}

interface FreshdeskArticleDetail {
  id: number;
  title: string;
  description: string;
  description_text?: string;
  status: number;
  language: string;
  language_code?: string;
  folder_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/freshdesk/articles/:articleId
 * Get full article details including HTML body
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { articleId } = await context.params;
    const articleIdNum = parseInt(articleId, 10);

    if (isNaN(articleIdNum)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await freshdeskFetch<FreshdeskArticleDetail>(
      `/api/v2/solutions/articles/${articleIdNum}`
    );

    return NextResponse.json(article, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch article:', error);

    return NextResponse.json(
      { error: 'Failed to fetch article', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
