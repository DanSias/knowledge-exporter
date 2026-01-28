'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: number;
  title: string;
  status: number;
  language?: string;
  isPublished: boolean;
  isEnglish: boolean;
  updatedAt: string;
}

interface ArticleDetail {
  id: number;
  title: string;
  description: string;
  description_text?: string;
  status: number;
  language: string;
  folder_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export default function FreshdeskExplorePage() {
  // State for categories and their expanded state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Track expanded categories and folders
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Folder data cached by category ID
  const [foldersByCategory, setFoldersByCategory] = useState<Map<number, Folder[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<number>>(new Set());

  // Article data cached by folder ID
  const [articlesByFolder, setArticlesByFolder] = useState<Map<number, Article[]>>(new Map());
  const [loadingArticles, setLoadingArticles] = useState<Set<number>>(new Set());

  // Selected article and its full data
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [loadingArticleDetail, setLoadingArticleDetail] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Toggle for raw HTML view
  const [showRawHtml, setShowRawHtml] = useState(false);

  // Load categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/freshdesk/categories');

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
        setCategoriesError(null);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = async (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);

    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);

      // Fetch folders if not already loaded
      if (!foldersByCategory.has(categoryId) && !loadingFolders.has(categoryId)) {
        await fetchFolders(categoryId);
      }
    }

    setExpandedCategories(newExpanded);
  };

  // Fetch folders for a category
  const fetchFolders = async (categoryId: number) => {
    try {
      setLoadingFolders(new Set(loadingFolders).add(categoryId));

      const response = await fetch(`/api/freshdesk/categories/${categoryId}/folders`);

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setFoldersByCategory(new Map(foldersByCategory).set(categoryId, data));
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      const newLoading = new Set(loadingFolders);
      newLoading.delete(categoryId);
      setLoadingFolders(newLoading);
    }
  };

  // Toggle folder expansion
  const toggleFolder = async (folderId: number) => {
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);

      // Fetch articles if not already loaded
      if (!articlesByFolder.has(folderId) && !loadingArticles.has(folderId)) {
        await fetchArticles(folderId);
      }
    }

    setExpandedFolders(newExpanded);
  };

  // Fetch articles for a folder
  const fetchArticles = async (folderId: number) => {
    try {
      setLoadingArticles(new Set(loadingArticles).add(folderId));

      const response = await fetch(`/api/freshdesk/folders/${folderId}/articles`);

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticlesByFolder(new Map(articlesByFolder).set(folderId, data.articles));
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      const newLoading = new Set(loadingArticles);
      newLoading.delete(folderId);
      setLoadingArticles(newLoading);
    }
  };

  // Select and fetch article detail
  const selectArticle = async (articleId: number) => {
    setSelectedArticleId(articleId);
    setLoadingArticleDetail(true);
    setArticleError(null);
    setShowRawHtml(false);

    try {
      const response = await fetch(`/api/freshdesk/articles/${articleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      setArticleDetail(data);
    } catch (error) {
      console.error('Error fetching article detail:', error);
      setArticleError(error instanceof Error ? error.message : 'Unknown error');
      setArticleDetail(null);
    } finally {
      setLoadingArticleDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Freshdesk Knowledge Base Explorer
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Browse and preview Freshdesk articles
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left sidebar - Browse tree */}
          <div className="space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Categories
            </h2>

            {loadingCategories && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
              </div>
            )}

            {categoriesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                Error: {categoriesError}
              </div>
            )}

            {!loadingCategories && !categoriesError && categories.length === 0 && (
              <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No categories found
              </div>
            )}

            {!loadingCategories && categories.map((category) => (
              <div key={category.id} className="border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <span className="text-zinc-400">
                    {expandedCategories.has(category.id) ? '▼' : '▶'}
                  </span>
                  <span className="flex-1 truncate">{category.name}</span>
                  {loadingFolders.has(category.id) && (
                    <div className="h-4 w-4 animate-spin rounded-full border border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
                  )}
                </button>

                {/* Folders */}
                {expandedCategories.has(category.id) && foldersByCategory.has(category.id) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {foldersByCategory.get(category.id)!.map((folder) => (
                      <div key={folder.id}>
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <span className="text-xs text-zinc-400">
                            {expandedFolders.has(folder.id) ? '▼' : '▶'}
                          </span>
                          <span className="flex-1 truncate">{folder.name}</span>
                          {loadingArticles.has(folder.id) && (
                            <div className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
                          )}
                        </button>

                        {/* Articles */}
                        {expandedFolders.has(folder.id) && articlesByFolder.has(folder.id) && (
                          <div className="ml-4 mt-1 space-y-0.5">
                            {articlesByFolder.get(folder.id)!.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => selectArticle(article.id)}
                                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                                  selectedArticleId === article.id
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                <span className="flex-1 truncate">{article.title}</span>
                                {!article.isPublished && (
                                  <span className="rounded bg-yellow-100 px-1 text-[10px] text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                    Draft
                                  </span>
                                )}
                              </button>
                            ))}
                            {articlesByFolder.get(folder.id)!.length === 0 && (
                              <div className="px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500">
                                No articles
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {foldersByCategory.get(category.id)!.length === 0 && (
                      <div className="px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500">
                        No folders
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right panel - Article viewer */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {!selectedArticleId && (
              <div className="flex h-64 items-center justify-center text-zinc-500 dark:text-zinc-400">
                Select an article to view
              </div>
            )}

            {selectedArticleId && loadingArticleDetail && (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
              </div>
            )}

            {selectedArticleId && articleError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                <p className="font-medium">Error loading article</p>
                <p className="mt-1 text-sm">{articleError}</p>
              </div>
            )}

            {selectedArticleId && !loadingArticleDetail && articleDetail && (
              <div className="space-y-4">
                {/* Article header */}
                <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {articleDetail.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>ID: {articleDetail.id}</span>
                    <span>•</span>
                    <span>Status: {articleDetail.status === 2 ? 'Published' : 'Draft'}</span>
                    <span>•</span>
                    <span>Language: {articleDetail.language}</span>
                    <span>•</span>
                    <span>Updated: {new Date(articleDetail.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Toggle raw HTML button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRawHtml(!showRawHtml)}
                    className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {showRawHtml ? 'Hide raw HTML' : 'View raw HTML'}
                  </button>
                </div>

                {/* Article content */}
                {!showRawHtml && (
                  <div
                    className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-900 prose-headings:dark:text-zinc-50 prose-p:text-zinc-700 prose-p:dark:text-zinc-300 prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-code:text-zinc-900 prose-code:dark:text-zinc-50"
                    dangerouslySetInnerHTML={{ __html: articleDetail.description }}
                  />
                )}

                {/* Raw HTML view */}
                {showRawHtml && (
                  <div className="rounded-lg bg-zinc-900 p-4 dark:bg-zinc-950">
                    <pre className="overflow-x-auto text-xs text-zinc-100 dark:text-zinc-300">
                      <code>{articleDetail.description}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
