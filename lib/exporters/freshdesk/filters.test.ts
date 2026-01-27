/**
 * Unit tests for Freshdesk article filtering logic
 */

import { describe, it, expect } from 'vitest';
import {
  isPublished,
  isEnglish,
  isPublishedEnglish,
  computeArticleCounts,
} from './filters';
import { FreshdeskArticle } from './types';

// Helper to create test article
function createArticle(
  overrides: Partial<FreshdeskArticle> = {}
): FreshdeskArticle {
  return {
    id: 1,
    title: 'Test Article',
    description: 'Test description',
    folder_id: 1,
    status: 2, // Published by default
    type: 1,
    tags: [],
    thumbs_up: 0,
    thumbs_down: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    language: 'en', // English by default
    ...overrides,
  };
}

describe('isPublished', () => {
  it('returns true for published articles (status === 2)', () => {
    const article = createArticle({ status: 2 });
    expect(isPublished(article)).toBe(true);
  });

  it('returns false for draft articles (status === 1)', () => {
    const article = createArticle({ status: 1 });
    expect(isPublished(article)).toBe(false);
  });

  it('returns false for other status values', () => {
    const article = createArticle({ status: 0 });
    expect(isPublished(article)).toBe(false);
  });
});

describe('isEnglish', () => {
  it('returns true when language field is "en"', () => {
    const article = createArticle({ language: 'en' });
    expect(isEnglish(article)).toBe(true);
  });

  it('returns true when language_code field is "en"', () => {
    const article = createArticle({
      language: undefined,
      language_code: 'en',
    });
    expect(isEnglish(article)).toBe(true);
  });

  it('returns false for non-English language', () => {
    const article = createArticle({ language: 'es' });
    expect(isEnglish(article)).toBe(false);
  });

  it('returns false for non-English language_code', () => {
    const article = createArticle({
      language: undefined,
      language_code: 'fr',
    });
    expect(isEnglish(article)).toBe(false);
  });

  it('prefers language field over language_code', () => {
    const article = createArticle({
      language: 'en',
      language_code: 'es',
    });
    expect(isEnglish(article)).toBe(true);
  });
});

describe('isPublishedEnglish', () => {
  it('returns true for published English articles', () => {
    const article = createArticle({ status: 2, language: 'en' });
    expect(isPublishedEnglish(article)).toBe(true);
  });

  it('returns false for draft English articles', () => {
    const article = createArticle({ status: 1, language: 'en' });
    expect(isPublishedEnglish(article)).toBe(false);
  });

  it('returns false for published non-English articles', () => {
    const article = createArticle({ status: 2, language: 'es' });
    expect(isPublishedEnglish(article)).toBe(false);
  });

  it('returns false for draft non-English articles', () => {
    const article = createArticle({ status: 1, language: 'es' });
    expect(isPublishedEnglish(article)).toBe(false);
  });
});

describe('computeArticleCounts', () => {
  it('returns zero counts for empty array', () => {
    const counts = computeArticleCounts([]);
    expect(counts).toEqual({
      total: 0,
      published: 0,
      englishPublished: 0,
    });
  });

  it('counts all articles correctly', () => {
    const articles = [
      createArticle({ id: 1, status: 2, language: 'en' }), // Published English
      createArticle({ id: 2, status: 2, language: 'en' }), // Published English
      createArticle({ id: 3, status: 1, language: 'en' }), // Draft English
      createArticle({ id: 4, status: 2, language: 'es' }), // Published Spanish
      createArticle({ id: 5, status: 1, language: 'es' }), // Draft Spanish
    ];

    const counts = computeArticleCounts(articles);
    expect(counts).toEqual({
      total: 5,
      published: 3, // Articles 1, 2, 4
      englishPublished: 2, // Articles 1, 2
    });
  });

  it('handles articles with language_code field', () => {
    const articles = [
      createArticle({
        id: 1,
        status: 2,
        language: undefined,
        language_code: 'en',
      }),
      createArticle({
        id: 2,
        status: 2,
        language: undefined,
        language_code: 'fr',
      }),
    ];

    const counts = computeArticleCounts(articles);
    expect(counts).toEqual({
      total: 2,
      published: 2,
      englishPublished: 1, // Only article 1
    });
  });

  it('counts only published English articles correctly', () => {
    const articles = [
      createArticle({ id: 1, status: 2, language: 'en' }),
      createArticle({ id: 2, status: 2, language: 'en' }),
      createArticle({ id: 3, status: 2, language: 'en' }),
    ];

    const counts = computeArticleCounts(articles);
    expect(counts.englishPublished).toBe(3);
  });
});
