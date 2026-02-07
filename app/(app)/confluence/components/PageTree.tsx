'use client';

import { useState } from 'react';

export interface Page {
  id: string;
  title: string;
  status: string;
  parentId: string | null;
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

interface PageTreeProps {
  pages: Page[];
  selectedPageId: string | null;
  onPageClick: (pageId: string) => void;
}

/**
 * Build hierarchical tree from flat list of pages
 */
export function buildPageTree(flatPages: Page[]): PageTreeNode[] {
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

/**
 * PageTree component - displays hierarchical page tree with expand/collapse
 */
export function PageTree({ pages, selectedPageId, onPageClick }: PageTreeProps) {
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());

  // Build tree from flat pages
  const pageTree = buildPageTree(pages);

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
  function renderPageTree(nodes: PageTreeNode[], depth = 0): React.ReactNode {
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
              onClick={() => onPageClick(node.id)}
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

  return <>{renderPageTree(pageTree)}</>;
}
