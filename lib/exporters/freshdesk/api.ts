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
 * List articles in a folder
 * GET /api/v2/solutions/folders/:folder_id/articles
 */
export async function listArticles(folderId: number): Promise<FreshdeskArticle[]> {
  return freshdeskFetch<FreshdeskArticle[]>(
    `/api/v2/solutions/folders/${folderId}/articles`
  );
}
