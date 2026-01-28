/**
 * Folder articles detail endpoint
 * GET /api/export/freshdesk/folders/[folderId]/articles
 * Returns article titles and metadata for a specific folder
 */

import { NextResponse } from 'next/server';
import { listArticles } from '@/lib/exporters/freshdesk/api';
import { FreshdeskClientError } from '@/lib/exporters/freshdesk/client';
import { isPublished, isEnglish } from '@/lib/exporters/freshdesk/filters';

interface RouteContext {
  params: Promise<{
    folderId: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { folderId } = await context.params;
    const folderIdNum = parseInt(folderId, 10);

    if (isNaN(folderIdNum)) {
      return NextResponse.json(
        { error: 'Invalid folder ID' },
        { status: 400 }
      );
    }

    // Fetch articles for this folder
    const articles = await listArticles(folderIdNum);

    // Map to simplified structure with titles and metadata
    const articleList = articles.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      language: article.language || article.language_code,
      isPublished: isPublished(article),
      isEnglish: isEnglish(article),
      updatedAt: article.updated_at,
    }));

    return NextResponse.json(
      {
        folderId: folderIdNum,
        articles: articleList,
      },
      {
        // No caching - always fetch fresh data
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    // Handle FreshdeskClientError
    if (error instanceof FreshdeskClientError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch articles from Freshdesk',
          details: error.message,
        },
        { status: error.status || 500 }
      );
    }

    // Unknown error
    console.error('Folder articles error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
