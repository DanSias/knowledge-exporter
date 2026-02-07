import { useState } from 'react';
import { Alert } from '@/app/components/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';
import { CategoryDetailsModal } from '@/app/components/CategoryDetailsModal';
import { PreviewResult, CategoryPreview } from '@/lib/exporters/types';

interface StepScopeProps {
  previewData: PreviewResult | null;
  previewLoading: boolean;
  previewError: string | null;
  exportAll: boolean;
  selectedCategoryIds: Set<number>;
  selectionTotals: {
    folders: number;
    articles: number;
    englishPublished: number;
  } | null;
  setExportAll: (value: boolean) => void;
  toggleCategory: (id: number) => void;
  toggleSelectAll: () => void;
  onContinue: () => void;
  fetchPreview: () => void;
}

export function StepScope({
  previewData,
  previewLoading,
  previewError,
  exportAll,
  selectedCategoryIds,
  selectionTotals,
  setExportAll,
  toggleCategory,
  toggleSelectAll,
  onContinue,
  fetchPreview,
}: StepScopeProps) {
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryPreview | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCategoryModal = (category: CategoryPreview) => {
    setSelectedCategoryForModal(category);
    setIsModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCategoryForModal(null), 200);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Select Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previewLoading && (
              <Alert variant="info">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span>Loading categories from Freshdesk...</span>
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
              <>
                {/* Export all toggle with totals */}
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label
                        htmlFor="export-all"
                        className="block font-medium text-zinc-900 dark:text-zinc-100"
                      >
                        Export all categories
                      </label>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {previewData.totals.categoryCount} categories •{' '}
                        {previewData.totals.folderCount} folders •{' '}
                        {previewData.totals.articleCount} articles
                      </p>
                      {previewData.totals.englishPublishedArticleCount > 0 && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                          English published: {previewData.totals.englishPublishedArticleCount}
                        </p>
                      )}
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

                {/* Category selection */}
                {!exportAll && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Select Categories ({selectedCategoryIds.size} selected)
                        </h4>
                        {selectionTotals && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {selectionTotals.folders} folders • {selectionTotals.articles} articles
                          </p>
                        )}
                      </div>
                      <button
                        onClick={toggleSelectAll}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {selectedCategoryIds.size === previewData.categories.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      <div className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <div></div>
                        <div>Category</div>
                        <div className="text-right">Content</div>
                      </div>

                      {previewData.categories.map((category) => (
                        <div
                          key={category.id}
                          className={`grid grid-cols-[auto_1fr_auto] gap-4 rounded-md border border-zinc-200 px-4 py-3 transition-colors dark:border-zinc-800 ${
                            selectedCategoryIds.has(category.id)
                              ? 'bg-blue-50 hover:bg-zinc-100 dark:bg-blue-950/30 dark:hover:bg-zinc-800/50'
                              : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.has(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <button
                              onClick={() => openCategoryModal(category)}
                              className="cursor-pointer text-left font-medium text-blue-600 underline decoration-transparent transition-colors hover:text-blue-700 hover:decoration-current dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {category.name}
                            </button>
                          </div>
                          <button
                            onClick={() => openCategoryModal(category)}
                            className="cursor-pointer text-right text-sm text-zinc-600 underline decoration-transparent transition-colors hover:text-zinc-900 hover:decoration-current dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            {category.folderCount} folders • {category.articleCount} articles
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={onContinue}
                  disabled={!exportAll && selectedCategoryIds.size === 0}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Options
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <CategoryDetailsModal
        category={selectedCategoryForModal}
        isOpen={isModalOpen}
        onClose={closeCategoryModal}
      />
    </>
  );
}
