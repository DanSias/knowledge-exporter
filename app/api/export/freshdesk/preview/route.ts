/**
 * Preview route for Freshdesk Solutions
 * GET /api/export/freshdesk/preview
 */

import { NextResponse } from 'next/server';
import { resolveBaseUrl, FreshdeskClientError } from '@/lib/exporters/freshdesk/client';
import { listCategories, listFolders, listArticles } from '@/lib/exporters/freshdesk/api';
import { computeArticleCounts } from '@/lib/exporters/freshdesk/filters';
import { CategoryPreview, PreviewResult } from '@/lib/exporters/types';

export async function GET() {
  try {
    // Validate environment configuration
    const baseUrl = resolveBaseUrl();

    // Fetch all categories
    const categories = await listCategories();

    // For each category, fetch folders and articles to compute counts
    const categoryPreviews: CategoryPreview[] = await Promise.all(
      categories.map(async (category) => {
        const folders = await listFolders(category.id);

        // Fetch all articles across all folders in this category
        const allArticles = await Promise.all(
          folders.map((folder) => listArticles(folder.id))
        );

        // Flatten articles array
        const articles = allArticles.flat();

        // Compute counts
        const counts = computeArticleCounts(articles);

        return {
          id: category.id,
          name: category.name,
          folderCount: folders.length,
          articleCount: counts.total,
          publishedArticleCount: counts.published,
          englishPublishedArticleCount: counts.englishPublished,
        };
      })
    );

    const result: PreviewResult = {
      baseUrl,
      categories: categoryPreviews,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Handle FreshdeskClientError
    if (error instanceof FreshdeskClientError) {
      // Missing environment variables
      if (error.message.includes('environment variable')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // API errors
      return NextResponse.json(
        {
          error: 'Failed to fetch data from Freshdesk',
          details: error.message,
        },
        { status: error.status || 500 }
      );
    }

    // Unknown error
    console.error('Preview error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
