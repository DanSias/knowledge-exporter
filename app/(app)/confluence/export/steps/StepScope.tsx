import { useState } from 'react';
import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { SpacePeekModal } from '../components/SpacePeekModal';

interface Space {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
}

interface PreviewResult {
  site: string;
  spaces: Space[];
  totals: {
    spaceCount: number;
  };
}

interface StepScopeProps {
  previewData: PreviewResult | null;
  previewLoading: boolean;
  previewError: string | null;
  exportAll: boolean;
  selectedSpaceKeys: string[];
  showPersonalSpaces: boolean;
  searchQuery: string;
  filteredSpaces: Space[];
  setExportAll: (value: boolean) => void;
  toggleSpace: (key: string) => void;
  toggleSelectAll: () => void;
  setShowPersonalSpaces: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  onContinue: () => void;
  fetchPreview: () => void;
}

export function StepScope({
  previewData,
  previewLoading,
  previewError,
  exportAll,
  selectedSpaceKeys,
  showPersonalSpaces,
  searchQuery,
  filteredSpaces,
  setExportAll,
  toggleSpace,
  toggleSelectAll,
  setShowPersonalSpaces,
  setSearchQuery,
  onContinue,
  fetchPreview,
}: StepScopeProps) {
  const [peekSpace, setPeekSpace] = useState<Space | null>(null);

  const handleSelectSpaceFromModal = () => {
    if (peekSpace) {
      toggleSpace(peekSpace.key);
      setPeekSpace(null);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Select Scope</CardTitle>
      </CardHeader>
      <CardContent>
        {previewLoading && (
          <Alert variant="info">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span>Loading spaces from Confluence...</span>
            </div>
          </Alert>
        )}

        {previewError && (
          <Alert variant="error">
            <p className="font-medium">Failed to load preview</p>
            <p className="mt-1 text-sm">{previewError}</p>
            <button onClick={fetchPreview} className="mt-2 text-sm font-medium underline">
              Retry
            </button>
          </Alert>
        )}

        {previewData && !previewLoading && (
          <div className="space-y-4">
            {/* Export all toggle */}
            <div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label
                      htmlFor="export-all"
                      className="block font-medium text-zinc-900 dark:text-zinc-100"
                    >
                      Export all spaces
                    </label>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Total: {previewData.totals.spaceCount} spaces
                    </p>
                  </div>
                  <input
                    id="export-all"
                    type="checkbox"
                    checked={exportAll}
                    onChange={(e) => setExportAll(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Space selection */}
            {!exportAll && (
              <div>
                {/* Controls */}
                <div className="mb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Select Spaces ({selectedSpaceKeys.length} of {previewData.totals.spaceCount}{' '}
                        selected)
                      </h4>
                      {filteredSpaces.length !== previewData.totals.spaceCount && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          Showing {filteredSpaces.length} filtered spaces
                        </p>
                      )}
                    </div>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      {selectedSpaceKeys.length === filteredSpaces.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-personal"
                      checked={showPersonalSpaces}
                      onChange={(e) => setShowPersonalSpaces(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="show-personal"
                      className="text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      Show personal spaces
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by name or key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Compact space list - single line per row */}
                <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
                  {filteredSpaces.length === 0 && (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                      {searchQuery
                        ? 'No spaces match your search'
                        : showPersonalSpaces
                        ? 'No spaces found'
                        : 'No spaces to display. Enable "Show personal spaces" to see more.'}
                    </div>
                  )}

                  {filteredSpaces.map((space) => (
                    <div
                      key={space.id}
                      className={`flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-2.5 transition-colors dark:border-zinc-800 ${
                        selectedSpaceKeys.includes(space.key)
                          ? 'bg-blue-50 hover:bg-zinc-100 dark:bg-blue-950/30 dark:hover:bg-zinc-800/50'
                          : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpaceKeys.includes(space.key)}
                        onChange={() => toggleSpace(space.key)}
                        className="h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setPeekSpace(space)}
                        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="Peek inside space"
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </button>
                      <span
                        onClick={() => setPeekSpace(space)}
                        className="min-w-0 flex-1 cursor-pointer truncate font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {space.name}
                      </span>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {space.key}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            space.type === 'personal'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {space.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Continue button */}
                <button
                  onClick={onContinue}
                  disabled={selectedSpaceKeys.length === 0}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Options
                </button>
              </div>
            )}

            {/* Continue button when exportAll is true */}
            {exportAll && (
              <button
                onClick={onContinue}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue to Options
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Peek Modal */}
    {peekSpace && (
      <SpacePeekModal
        space={peekSpace}
        isOpen={!!peekSpace}
        onClose={() => setPeekSpace(null)}
        onSelectSpace={handleSelectSpaceFromModal}
      />
    )}
    </>
  );
}
