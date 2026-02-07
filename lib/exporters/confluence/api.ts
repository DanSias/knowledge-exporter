/**
 * Confluence Cloud API functions
 * Uses Confluence REST API v1 (the stable, widely-used API)
 */

import { confluenceFetch } from './client';
import { ConfluenceSpace, SpaceListResponse, ConfluencePage, PageListResponse, ConfluencePageWithBody } from './types';

/**
 * List all spaces in the Confluence site
 * GET /rest/api/space
 *
 * Confluence REST API v1 uses start/limit pagination
 */
export async function listSpaces(): Promise<ConfluenceSpace[]> {
  const allSpaces: ConfluenceSpace[] = [];
  let start = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response: SpaceListResponse = await confluenceFetch<SpaceListResponse>(
      `/rest/api/space?limit=${limit}&start=${start}`
    );

    if (response.results && response.results.length > 0) {
      allSpaces.push(...response.results);
    }

    // Check if there are more pages
    hasMore = response.results.length === limit;
    start += limit;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[listSpaces] Fetched ${response.results.length} spaces, total: ${allSpaces.length}`);
    }
  }

  return allSpaces;
}

/**
 * Get page count for a space
 * Uses REST API v1 content search with limit=0 to get total count efficiently
 */
export async function getSpacePageCount(spaceKey: string): Promise<number> {
  try {
    const response = await confluenceFetch<PageListResponse>(
      `/rest/api/content?type=page&spaceKey=${spaceKey}&limit=0`
    );

    // The size property contains the total number of pages
    return response.size || 0;
  } catch (error) {
    console.error(`Failed to get page count for space ${spaceKey}:`, error);
    return 0;
  }
}

/**
 * List pages in a space with hierarchy information
 * GET /rest/api/content?type=page&spaceKey={spaceKey}&expand=ancestors
 *
 * Returns up to 500 pages to avoid performance issues
 * Includes ancestors for building hierarchy
 */
export async function listPagesInSpace(spaceKey: string): Promise<ConfluencePage[]> {
  const allPages: ConfluencePage[] = [];
  const MAX_PAGES = 500;
  let start = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore && allPages.length < MAX_PAGES) {
    const response: PageListResponse = await confluenceFetch<PageListResponse>(
      `/rest/api/content?type=page&spaceKey=${spaceKey}&limit=${limit}&start=${start}&expand=ancestors`
    );

    if (response.results && response.results.length > 0) {
      allPages.push(...response.results);
    }

    // Check if there are more pages
    hasMore = response.results.length === limit;
    start += limit;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[listPagesInSpace] Fetched ${response.results.length} pages for ${spaceKey}, total: ${allPages.length}`);
    }

    // Check if we've hit the limit
    if (allPages.length >= MAX_PAGES) {
      break;
    }
  }

  return allPages.slice(0, MAX_PAGES);
}

/**
 * Get a single page with full body content
 * GET /rest/api/content/{pageId}?expand=body.storage,version,space,ancestors
 *
 * Includes body.storage format for HTML-like rendering
 */
export async function getPage(pageId: string): Promise<ConfluencePageWithBody> {
  const response: ConfluencePageWithBody = await confluenceFetch<ConfluencePageWithBody>(
    `/rest/api/content/${pageId}?expand=body.storage,version,space,ancestors`
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[getPage] Fetched page ${pageId}: ${response.title}`);
  }

  return response;
}
