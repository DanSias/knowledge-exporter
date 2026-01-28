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
        const folderArticles = await Promise.all(
          folders.map((folder) => listArticles(folder.id))
        );

        // Compute per-folder counts and build folder preview
        const folderPreviews = folders.map((folder, index) => {
          const articles = folderArticles[index];
          const counts = computeArticleCounts(articles);

          return {
            id: folder.id,
            name: folder.name,
            articleCount: counts.total,
            publishedArticleCount: counts.published,
            englishPublishedArticleCount: counts.englishPublished,
          };
        });

        // Flatten articles array for category-level counts
        const articles = folderArticles.flat();

        // Compute category-level counts
        const counts = computeArticleCounts(articles);

        return {
          id: category.id,
          name: category.name,
          folderCount: folders.length,
          articleCount: counts.total,
          publishedArticleCount: counts.published,
          englishPublishedArticleCount: counts.englishPublished,
          folders: folderPreviews,
        };
      })
    );

    // Compute totals across all categories
    const totals = {
      categoryCount: categoryPreviews.length,
      folderCount: categoryPreviews.reduce((sum, cat) => sum + cat.folderCount, 0),
      articleCount: categoryPreviews.reduce((sum, cat) => sum + cat.articleCount, 0),
      publishedArticleCount: categoryPreviews.reduce((sum, cat) => sum + cat.publishedArticleCount, 0),
      englishPublishedArticleCount: categoryPreviews.reduce((sum, cat) => sum + cat.englishPublishedArticleCount, 0),
    };

    const result: PreviewResult = {
      baseUrl,
      categories: categoryPreviews,
      totals,
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
