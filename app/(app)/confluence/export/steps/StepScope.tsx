import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

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

interface SpaceCounts {
  [spaceKey: string]: number;
}

interface StepScopeProps {
  previewData: PreviewResult | null;
  previewLoading: boolean;
  previewError: string | null;
  exportAll: boolean;
  selectedSpaceIds: Set<string>;
  showPersonalSpaces: boolean;
  searchQuery: string;
  spaceCounts: SpaceCounts;
  countsLoading: boolean;
  filteredSpaces: Space[];
  setExportAll: (value: boolean) => void;
  toggleSpace: (id: string) => void;
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
  selectedSpaceIds,
  showPersonalSpaces,
  searchQuery,
  spaceCounts,
  countsLoading,
  filteredSpaces,
  setExportAll,
  toggleSpace,
  toggleSelectAll,
  setShowPersonalSpaces,
  setSearchQuery,
  onContinue,
  fetchPreview,
}: StepScopeProps) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader>
        <CardTitle>Step 2: Select Scope</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
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
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Fixed section: Export all toggle */}
            <div className="mb-4 flex-shrink-0">
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

            {/* Conditional section: Space selection (scrollable) */}
            {!exportAll && (
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Fixed controls */}
                <div className="mb-3 flex-shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Select Spaces ({selectedSpaceIds.size} of {previewData.totals.spaceCount}{' '}
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
                      {selectedSpaceIds.size === filteredSpaces.length
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

                {/* Scrollable space list */}
                <div className="mb-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  <div className="sticky top-0 grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <div></div>
                    <div>Space</div>
                    <div className="text-right">Pages</div>
                  </div>

                  {filteredSpaces.length === 0 && (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                      {searchQuery
                        ? 'No spaces match your search'
                        : showPersonalSpaces
                        ? 'No spaces found'
                        : 'No spaces to display. Enable "Show personal spaces" to see more.'}
                    </div>
                  )}

                  {filteredSpaces.map((space) => {
                    const pageCount = spaceCounts[space.key];
                    const countDisplay = countsLoading
                      ? '...'
                      : pageCount !== undefined
                      ? pageCount.toLocaleString()
                      : '—';

                    return (
                      <div
                        key={space.id}
                        className={`grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 px-4 py-3 transition-colors dark:border-zinc-800 ${
                          selectedSpaceIds.has(space.id)
                            ? 'bg-blue-50 hover:bg-zinc-100 dark:bg-blue-950/30 dark:hover:bg-zinc-800/50'
                            : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpaceIds.has(space.id)}
                          onChange={() => toggleSpace(space.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {space.name}
                            </span>
                            {space.type === 'personal' && (
                              <span className="text-xs text-zinc-400 dark:text-zinc-600">👤</span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {space.key} • {space.type}
                          </div>
                        </div>
                        <div className="text-right text-sm text-zinc-600 dark:text-zinc-400">
                          {countDisplay} pages
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fixed footer: Continue button */}
                <div className="flex-shrink-0 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <button
                    onClick={onContinue}
                    disabled={selectedSpaceIds.size === 0}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue to Options
                  </button>
                </div>
              </div>
            )}

            {/* Continue button when exportAll is true */}
            {exportAll && (
              <div className="flex-shrink-0">
                <button
                  onClick={onContinue}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Continue to Options
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
