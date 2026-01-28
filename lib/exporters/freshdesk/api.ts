/**
 * Freshdesk Solutions API functions
 * Uses Freshdesk Solutions v2 endpoints
 */

import { freshdeskFetch } from './client';
import { FreshdeskCategory, FreshdeskFolder, FreshdeskArticle } from './types';

/**
 * List all solution categories
 * GET /api/v2/solutions/categories
 */
export async function listCategories(): Promise<FreshdeskCategory[]> {
  return freshdeskFetch<FreshdeskCategory[]>('/api/v2/solutions/categories');
}

/**
 * List folders in a category
 * GET /api/v2/solutions/categories/:category_id/folders
 */
export async function listFolders(categoryId: number): Promise<FreshdeskFolder[]> {
  return freshdeskFetch<FreshdeskFolder[]>(
    `/api/v2/solutions/categories/${categoryId}/folders`
  );
}

/**
 * List articles in a folder with pagination support
 * GET /api/v2/solutions/folders/:folder_id/articles
 * Freshdesk v2 API paginates results (default 30 per page, max 100)
 */
export async function listArticles(folderId: number): Promise<FreshdeskArticle[]> {
  const allArticles: FreshdeskArticle[] = [];
  let page = 1;
  const perPage = 100; // Max allowed by Freshdesk API

  while (true) {
    const articles = await freshdeskFetch<FreshdeskArticle[]>(
      `/api/v2/solutions/folders/${folderId}/articles?page=${page}&per_page=${perPage}`
    );

    if (!articles || articles.length === 0) {
      // No more articles
      break;
    }

    allArticles.push(...articles);

    // If we got fewer than perPage, we've reached the end
    if (articles.length < perPage) {
      break;
    }

    page++;
  }

  return allArticles;
}
