'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { CategoryPreview } from '@/lib/exporters/types';

interface Article {
  id: number;
  title: string;
  status?: number;
  language?: string;
  isPublished?: boolean;
  isEnglish?: boolean;
  updatedAt?: string;
}

interface FolderArticlesState {
  loading: boolean;
  error: string | null;
  articles: Article[] | null;
}

interface CategoryDetailsModalProps {
  category: CategoryPreview | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryDetailsModal({
  category,
  isOpen,
  onClose,
}: CategoryDetailsModalProps) {
  // Track expanded folders and their article data
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [folderArticles, setFolderArticles] = useState<Map<number, FolderArticlesState>>(
    new Map()
  );

  // Reset state when modal closes
  const handleClose = () => {
    setExpandedFolders(new Set());
    setFolderArticles(new Map());
    onClose();
  };

  const toggleFolder = async (folderId: number) => {
    const isExpanded = expandedFolders.has(folderId);

    if (isExpanded) {
      // Collapse folder
      const newExpanded = new Set(expandedFolders);
      newExpanded.delete(folderId);
      setExpandedFolders(newExpanded);
    } else {
      // Expand folder
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(folderId);
      setExpandedFolders(newExpanded);

      // If articles not already loaded, fetch them
      if (!folderArticles.has(folderId)) {
        // Set loading state
        const newArticles = new Map(folderArticles);
        newArticles.set(folderId, { loading: true, error: null, articles: null });
        setFolderArticles(newArticles);

        try {
          const response = await fetch(
            `/api/export/freshdesk/folders/${folderId}/articles`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch articles');
          }

          const data = await response.json();

          // Update with fetched articles
          const updatedArticles = new Map(folderArticles);
          updatedArticles.set(folderId, {
            loading: false,
            error: null,
            articles: data.articles,
          });
          setFolderArticles(updatedArticles);
        } catch (error) {
          // Update with error
          const updatedArticles = new Map(folderArticles);
          updatedArticles.set(folderId, {
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load articles',
            articles: null,
          });
          setFolderArticles(updatedArticles);
        }
      }
    }
  };

  const retryFetch = (folderId: number) => {
    // Clear error state and retry
    const newArticles = new Map(folderArticles);
    newArticles.delete(folderId);
    setFolderArticles(newArticles);
    toggleFolder(folderId);
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-zinc-900 shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-700 p-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {category.name}
              </DialogTitle>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {category.folderCount} folders • {category.articleCount} articles
                {category.publishedArticleCount > 0 && (
                  <> • {category.publishedArticleCount} published</>
                )}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close dialog"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {category.folders.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No folders in this category.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Folders in this category:
                </h3>
                {category.folders.map((folder) => {
                  const isExpanded = expandedFolders.has(folder.id);
                  const articlesState = folderArticles.get(folder.id);

                  return (
                    <div key={folder.id} className="border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                      {/* Folder header - clickable */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {/* Expand/collapse icon */}
                          <svg
                            className={`w-4 h-4 text-zinc-500 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {folder.name}
                          </p>
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 ml-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 text-xs font-medium">
                            {folder.articleCount} article{folder.articleCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>

                      {/* Expanded content - article list */}
                      {isExpanded && (
                        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                          {articlesState?.loading && (
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 py-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                              <span>Loading articles...</span>
                            </div>
                          )}

                          {articlesState?.error && (
                            <div className="text-sm text-red-600 dark:text-red-400 py-2">
                              <p className="font-medium">Failed to load articles</p>
                              <p className="mt-1">{articlesState.error}</p>
                              <button
                                onClick={() => retryFetch(folder.id)}
                                className="mt-2 text-sm font-medium underline hover:no-underline"
                              >
                                Retry
                              </button>
                            </div>
                          )}

                          {articlesState?.articles && articlesState.articles.length === 0 && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-2">
                              No articles in this folder.
                            </p>
                          )}

                          {articlesState?.articles && articlesState.articles.length > 0 && (
                            <ul className="space-y-1.5">
                              {articlesState.articles.map((article) => (
                                <li
                                  key={article.id}
                                  className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                                >
                                  <span className="text-zinc-400 dark:text-zinc-600 mt-1.5">•</span>
                                  <span className="flex-1">{article.title}</span>
                                  {article.isPublished && (
                                    <span className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      ✓
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
