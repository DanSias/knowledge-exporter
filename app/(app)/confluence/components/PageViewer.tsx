'use client';

import { useState } from 'react';

export interface PageDetail {
  id: string;
  title: string;
  status: string;
  parentId: string | null;
  createdAt: string | null;
  body: string;
}

interface PageViewerProps {
  pageDetail: PageDetail;
  loading?: boolean;
}

/**
 * PageViewer component - displays page content with optional raw storage view
 */
export function PageViewer({ pageDetail, loading = false }: PageViewerProps) {
  const [showRawStorage, setShowRawStorage] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading page...
      </div>
    );
  }

  return (
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
  );
}
