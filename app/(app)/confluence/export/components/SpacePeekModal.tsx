'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { Alert } from '@/app/components/Alert';
import { PageTree, type Page } from '@/app/(app)/confluence/components/PageTree';
import { PageViewer, type PageDetail } from '@/app/(app)/confluence/components/PageViewer';

interface Space {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
}

interface SpacePeekModalProps {
  space: Space;
  isOpen: boolean;
  onClose: () => void;
  onSelectSpace?: () => void;
}

// Session-level cache for space pages
const spaceCache = new Map<string, { pages: Page[]; truncated: boolean }>();

export function SpacePeekModal({ space, isOpen, onClose, onSelectSpace }: SpacePeekModalProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [truncatedWarning, setTruncatedWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page detail state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageDetail, setPageDetail] = useState<PageDetail | null>(null);
  const [loadingPageDetail, setLoadingPageDetail] = useState(false);

  // Fetch pages when modal opens
  const fetchPages = useCallback(async () => {
    // Check cache first
    const cached = spaceCache.get(space.key);
    if (cached) {
      setPages(cached.pages);
      setTruncatedWarning(cached.truncated);
      return;
    }

    setLoadingPages(true);
    setError(null);

    try {
      const response = await fetch(`/api/confluence/spaces/${space.key}/pages`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch pages');
      }
      const data = await response.json();
      const fetchedPages = data.pages || [];
      const isTruncated = data.truncated || false;

      setPages(fetchedPages);
      setTruncatedWarning(isTruncated);

      // Cache the result
      spaceCache.set(space.key, { pages: fetchedPages, truncated: isTruncated });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pages';
      setError(`Failed to load pages: ${errorMessage}`);
      console.error('Error fetching pages:', err);
    } finally {
      setLoadingPages(false);
    }
  }, [space.key]);

  // Fetch pages when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPages();
    } else {
      // Reset when modal closes
      setSelectedPageId(null);
      setPageDetail(null);
      setError(null);
    }
  }, [isOpen, fetchPages]);

  // Fetch page detail when a page is clicked
  async function handlePageClick(pageId: string) {
    if (selectedPageId === pageId) {
      // Deselect
      setSelectedPageId(null);
      setPageDetail(null);
      return;
    }

    setSelectedPageId(pageId);
    setLoadingPageDetail(true);
    setPageDetail(null);
    setError(null);

    try {
      const response = await fetch(`/api/confluence/pages/${pageId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch page');
      }
      const data: PageDetail = await response.json();
      setPageDetail(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load page';
      setError(`Failed to load page: ${errorMessage}`);
      console.error('Error fetching page:', err);
    } finally {
      setLoadingPageDetail(false);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl dark:bg-zinc-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {space.name}
              </Dialog.Title>
              <p className="mt-1 text-sm text-zinc-500">
                Space key: {space.key} • Type: {space.type}
              </p>
            </div>
            {onSelectSpace && (
              <button
                onClick={onSelectSpace}
                className="mr-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Select this space
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1">
            {/* Left: Page Tree */}
            <div className="w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800">
              <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pages</h3>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(90vh - 140px)' }}>
                {loadingPages && (
                  <div className="px-4 py-3 text-sm text-zinc-500">Loading pages...</div>
                )}
                {truncatedWarning && (
                  <div className="m-3">
                    <Alert variant="warning">
                      Showing first 500 pages. This space may have more pages.
                    </Alert>
                  </div>
                )}
                {!loadingPages && pages.length === 0 && (
                  <div className="px-4 py-3 text-sm text-zinc-500">No pages found</div>
                )}
                {!loadingPages && pages.length > 0 && (
                  <PageTree
                    pages={pages}
                    selectedPageId={selectedPageId}
                    onPageClick={handlePageClick}
                  />
                )}
              </div>
            </div>

            {/* Right: Page Viewer */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
              {error && (
                <div className="p-6">
                  <Alert variant="error">{error}</Alert>
                </div>
              )}

              {!selectedPageId && !error && (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Select a page to view its content
                </div>
              )}

              {loadingPageDetail && (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Loading page...
                </div>
              )}

              {!loadingPageDetail && pageDetail && (
                <PageViewer pageDetail={pageDetail} loading={loadingPageDetail} />
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
