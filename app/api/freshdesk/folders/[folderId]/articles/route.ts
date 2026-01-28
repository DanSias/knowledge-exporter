import { NextResponse } from 'next/server';
import { listArticles } from '@/lib/exporters/freshdesk/api';
import { isPublished, isEnglish } from '@/lib/exporters/freshdesk/filters';

interface RouteContext {
  params: Promise<{ folderId: string }>;
}

/**
 * GET /api/freshdesk/folders/:folderId/articles
 * List articles in a Freshdesk folder
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { folderId } = await context.params;
    const folderIdNum = parseInt(folderId, 10);

    if (isNaN(folderIdNum)) {
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    const articles = await listArticles(folderIdNum);

    // Return articles with helper metadata
    const articleList = articles.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      language: article.language || article.language_code,
      isPublished: isPublished(article),
      isEnglish: isEnglish(article),
      updatedAt: article.updated_at,
    }));

    return NextResponse.json({ folderId: folderIdNum, articles: articleList }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch articles:', error);

    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
