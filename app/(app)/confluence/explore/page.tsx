'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/app/components/Alert';

interface Space {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
}

interface Page {
  id: string;
  title: string;
  status: string;
  parentId: string | null;
}

interface PageDetail {
  id: string;
  title: string;
  status: string;
  parentId: string | null;
  createdAt: string | null;
  body: string;
}

interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

export default function ConfluenceExplorePage() {
  // Left panel: Spaces
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [selectedSpaceKey, setSelectedSpaceKey] = useState<string | null>(null);
  const [showPersonalSpaces, setShowPersonalSpaces] = useState(false);

  // Middle panel: Page tree
  const [pages, setPages] = useState<Page[]>([]);
  const [pageTree, setPageTree] = useState<PageTreeNode[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  const [truncatedWarning, setTruncatedWarning] = useState(false);

  // Right panel: Page viewer
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageDetail, setPageDetail] = useState<PageDetail | null>(null);
  const [loadingPageDetail, setLoadingPageDetail] = useState(false);
  const [showRawStorage, setShowRawStorage] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Fetch spaces on mount
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const response = await fetch('/api/confluence/spaces');
        if (!response.ok) {
          throw new Error('Failed to fetch spaces');
        }
        const data: Space[] = await response.json();
        setSpaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load spaces');
      } finally {
        setLoadingSpaces(false);
      }
    }

    fetchSpaces();
  }, []);

  // Fetch pages when a space is selected
  async function handleSpaceClick(spaceKey: string) {
    if (selectedSpaceKey === spaceKey) {
      // Deselect
      setSelectedSpaceKey(null);
      setPages([]);
      setPageTree([]);
      setSelectedPageId(null);
      setPageDetail(null);
      setTruncatedWarning(false);
      return;
    }

    setSelectedSpaceKey(spaceKey);
    setLoadingPages(true);
    setPages([]);
    setPageTree([]);
    setSelectedPageId(null);
    setPageDetail(null);
    setError(null);
    setTruncatedWarning(false);

    try {
      const response = await fetch(`/api/confluence/spaces/${spaceKey}/pages`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch pages');
      }
      const data = await response.json();
      setPages(data.pages || []);
      setTruncatedWarning(data.truncated || false);

      // Build page tree
      const tree = buildPageTree(data.pages || []);
      setPageTree(tree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pages';
      setError(`Failed to load pages for ${spaceKey}: ${errorMessage}`);
      console.error('Error fetching pages:', err);
    } finally {
      setLoadingPages(false);
    }
  }

  // Build hierarchical tree from flat list
  function buildPageTree(flatPages: Page[]): PageTreeNode[] {
    const pageMap = new Map<string, PageTreeNode>();
    const rootPages: PageTreeNode[] = [];

    // Initialize all pages with empty children arrays
    flatPages.forEach((page) => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Build parent-child relationships
    flatPages.forEach((page) => {
      const node = pageMap.get(page.id);
      if (!node) return;

      if (page.parentId) {
        const parent = pageMap.get(page.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootPages.push(node);
        }
      } else {
        // No parent, it's a root page
        rootPages.push(node);
      }
    });

    return rootPages;
  }

  // Fetch page detail when a page is clicked
  async function handlePageClick(pageId: string) {
    if (selectedPageId === pageId) {
      // Deselect
      setSelectedPageId(null);
      setPageDetail(null);
      setShowRawStorage(false);
      return;
    }

    setSelectedPageId(pageId);
    setLoadingPageDetail(true);
    setPageDetail(null);
    setError(null);
    setShowRawStorage(false);

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
      setError(`Failed to load page ${pageId}: ${errorMessage}`);
      console.error('Error fetching page:', err);
    } finally {
      setLoadingPageDetail(false);
    }
  }

  // Toggle page expansion in tree
  function togglePageExpansion(pageId: string) {
    setExpandedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }

  // Render page tree recursively
  function renderPageTree(nodes: PageTreeNode[], depth = 0) {
    return nodes.map((node) => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedPageIds.has(node.id);
      const isSelected = selectedPageId === node.id;

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
              isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePageExpansion(node.id);
                }}
                className="flex-shrink-0 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <span className="w-4 flex-shrink-0"></span>}
            <span
              onClick={() => handlePageClick(node.id)}
              className={`flex-1 truncate ${
                isSelected
                  ? 'font-medium text-blue-600 dark:text-blue-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {node.title}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderPageTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

  // Filter spaces based on showPersonalSpaces toggle
  const filteredSpaces = spaces.filter((space) => {
    if (showPersonalSpaces) {
      return true; // Show all spaces
    }
    return space.type !== 'personal'; // Hide personal spaces by default
  });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      {/* Left Panel: Spaces List */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spaces</h2>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showPersonalSpaces}
              onChange={(e) => setShowPersonalSpaces(e.target.checked)}
              className="rounded"
            />
            Show personal spaces
          </label>
        </div>
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 77px)' }}>
          {loadingSpaces && (
            <div className="px-4 py-3 text-sm text-zinc-500">Loading spaces...</div>
          )}
          {!loadingSpaces && filteredSpaces.length === 0 && spaces.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">No spaces found</div>
          )}
          {!loadingSpaces && filteredSpaces.length === 0 && spaces.length > 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">
              No spaces to display. Enable "Show personal spaces" to see {spaces.length} personal space{spaces.length === 1 ? '' : 's'}.
            </div>
          )}
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
              onClick={() => handleSpaceClick(space.key)}
              className={`cursor-pointer border-b border-zinc-100 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 ${
                selectedSpaceKey === space.key
                  ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1 truncate">{space.name}</span>
                {space.type === 'personal' && (
                  <span className="ml-2 flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                    👤
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel: Page Tree */}
      <div className="w-80 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {selectedSpaceKey ? `Pages in ${selectedSpaceKey}` : 'Pages'}
          </h2>
        </div>
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 53px)' }}>
          {!selectedSpaceKey && (
            <div className="px-4 py-3 text-sm text-zinc-500">
              Select a space to view pages
            </div>
          )}
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
          {!loadingPages && selectedSpaceKey && pageTree.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">No pages found</div>
          )}
          {!loadingPages && pageTree.length > 0 && renderPageTree(pageTree)}
        </div>
      </div>

      {/* Right Panel: Page Viewer */}
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
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {pageDetail.title}
              </h1>
              {pageDetail.createdAt && (
                <p className="mt-2 text-sm text-zinc-500">
                  Created: {new Date(pageDetail.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Toggle Raw Storage */}
            <div className="mb-4 flex items-center justify-end">
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={showRawStorage}
                  onChange={(e) => setShowRawStorage(e.target.checked)}
                  className="rounded"
                />
                View raw storage
              </label>
            </div>

            {/* Page Content */}
            {showRawStorage ? (
              <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {pageDetail.body}
              </pre>
            ) : (
              <div
                className="prose prose-zinc max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: pageDetail.body }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
