'use client';

import { useState, useMemo } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { StatusBadge } from './StatusBadge';

export interface FileEntry {
  pathRelative: string;
  pathAbsolute: string;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  bytes: number;
  hash: string | null;
  error: string | null;
}

interface ChangedFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileEntry[];
  title?: string;
}

/**
 * ChangedFilesModal - Reusable modal for viewing changed files in exports
 */
export function ChangedFilesModal({
  isOpen,
  onClose,
  files,
  title = 'Changed Files',
}: ChangedFilesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Filter files by tab
  const tabs = [
    {
      name: 'Changed',
      filter: (f: FileEntry) => f.status === 'created' || f.status === 'updated',
    },
    {
      name: 'Skipped',
      filter: (f: FileEntry) => f.status === 'skipped',
    },
    {
      name: 'Failed',
      filter: (f: FileEntry) => f.status === 'failed',
    },
    {
      name: 'All',
      filter: (_f: FileEntry) => true,
    },
  ];

  // Apply filters
  const filteredFiles = useMemo(() => {
    let result = files.filter(tabs[selectedTab].filter);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) => f.pathRelative.toLowerCase().includes(query));
    }

    return result;
  }, [files, selectedTab, searchQuery]);

  // Pagination
  const PAGE_SIZE = 200;
  const visibleFiles = showAll ? filteredFiles : filteredFiles.slice(0, PAGE_SIZE);
  const hasMore = filteredFiles.length > PAGE_SIZE && !showAll;

  // Format file size
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // Copy path to clipboard
  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl dark:bg-zinc-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </Dialog.Title>
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

          {/* Tabs */}
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <div className="border-b border-zinc-200 px-6 dark:border-zinc-800">
              <Tab.List className="flex gap-6">
                {tabs.map((tab, idx) => (
                  <Tab key={tab.name} className="focus:outline-none">
                    {({ selected }) => (
                      <div
                        className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {tab.name}
                        <span className="ml-2 text-xs text-zinc-500">
                          ({files.filter(tab.filter).length})
                        </span>
                      </div>
                    )}
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Search */}
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <input
                type="text"
                placeholder="Search by path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredFiles.length === 0 && (
                <div className="py-12 text-center text-sm text-zinc-500">
                  {searchQuery ? 'No files match your search' : 'No files to display'}
                </div>
              )}

              {visibleFiles.length > 0 && (
                <div className="space-y-2">
                  {visibleFiles.map((file, idx) => (
                    <div
                      key={`${file.pathRelative}-${idx}`}
                      className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <StatusBadge status={file.status} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          {file.pathRelative}
                        </p>
                        {file.error && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {file.error}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span className="text-xs text-zinc-500">{formatBytes(file.bytes)}</span>
                        <button
                          onClick={() => copyPath(file.pathAbsolute)}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          title="Copy absolute path"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show More Button */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Show {filteredFiles.length - PAGE_SIZE} more files
                  </button>
                </div>
              )}
            </div>
          </Tab.Group>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
