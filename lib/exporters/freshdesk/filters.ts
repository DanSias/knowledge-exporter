/**
 * Filtering utilities for Freshdesk articles
 */

import { FreshdeskArticle } from './types';

/**
 * Check if an article is published
 * Freshdesk status: 1 = Draft, 2 = Published
 */
export function isPublished(article: FreshdeskArticle): boolean {
  return article.status === 2;
}

/**
 * Check if an article is in English
 * Freshdesk may use either 'language' or 'language_code' field
 */
export function isEnglish(article: FreshdeskArticle): boolean {
  const lang = article.language || article.language_code;
  return lang === 'en';
}

/**
 * Check if an article is both published and in English
 */
export function isPublishedEnglish(article: FreshdeskArticle): boolean {
  return isPublished(article) && isEnglish(article);
}

/**
 * Compute article counts from a list of articles
 */
export interface ArticleCounts {
  total: number;
  published: number;
  englishPublished: number;
}

export function computeArticleCounts(articles: FreshdeskArticle[]): ArticleCounts {
  return {
    total: articles.length,
    published: articles.filter(isPublished).length,
    englishPublished: articles.filter(isPublishedEnglish).length,
  };
}
