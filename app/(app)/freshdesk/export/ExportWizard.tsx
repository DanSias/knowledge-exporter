'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { Alert } from '@/app/components/Alert';
import { PreviewResult } from '@/lib/exporters/types';
import { useExportJob } from '@/hooks/useExportJob';
import { StepConfigure } from './steps/StepConfigure';
import { StepScope } from './steps/StepScope';
import { StepOptions } from './steps/StepOptions';
import { StepRun } from './steps/StepRun';
import { StepResults } from './steps/StepResults';

interface ExportWizardProps {
  hasApiKey: boolean;
  hasHost: boolean;
  baseUrl: string | null;
}

export function ExportWizard({ hasApiKey, hasHost, baseUrl }: ExportWizardProps) {
  const isConfigured = hasApiKey && hasHost;

  // State for step progression
  const [currentStep, setCurrentStep] = useState<number>(isConfigured ? 2 : 1);

  // State for preview data
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // State for scope selection (Step 2)
  const [exportAll, setExportAll] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  // State for navigation blocking
  const [navigationBlockMessage, setNavigationBlockMessage] = useState<string | null>(null);

  // State for options (Step 3)
  const [outputDir, setOutputDir] = useState('./exports');
  const [runName, setRunName] = useState('');
  const [downloadAssets, setDownloadAssets] = useState(false);
  const [maxCharsPerFile, setMaxCharsPerFile] = useState('');
  const [languageMode, setLanguageMode] = useState<'all' | 'en'>('all');

  // Markdown quality options (Step 3)
  const [includeTitleAsH1, setIncludeTitleAsH1] = useState(false);
  const [normalizeHeadings, setNormalizeHeadings] = useState(false);
  const [collapseBlankLines, setCollapseBlankLines] = useState(true); // Default: ON
  const [stripEmptySections, setStripEmptySections] = useState(false);

  // Job management
  const { jobStatus, startJob } = useExportJob('freshdesk');

  // Fetch preview when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !previewData && !previewLoading && !previewError) {
      fetchPreview();
    }
  }, [currentStep, previewData, previewLoading, previewError]);

  // Auto-advance to results when job completes
  useEffect(() => {
    if ((jobStatus?.status === 'completed' || jobStatus?.status === 'failed') && currentStep === 4) {
      setCurrentStep(5);
    }
  }, [jobStatus?.status, currentStep]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/export/freshdesk/preview');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to fetch preview');
      }

      const data: PreviewResult = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Preview fetch error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartExport = async () => {
    try {
      const scope = {
        exportAll,
        categoryIds: exportAll ? undefined : Array.from(selectedCategoryIds),
      };

      const options = {
        outputDir,
        runName: runName || undefined,
        downloadAssets,
        maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
        languageMode,
        includeTitleAsH1,
        normalizeHeadings,
        collapseBlankLines,
        stripEmptySections,
      };

      await startJob(scope, options);
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to start export:', error);
      alert('Failed to start export: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newSet = new Set(selectedCategoryIds);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedCategoryIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!previewData) return;

    if (selectedCategoryIds.size === previewData.categories.length) {
      setSelectedCategoryIds(new Set());
    } else {
      setSelectedCategoryIds(new Set(previewData.categories.map((c) => c.id)));
    }
  };

  // Compute selection totals
  const selectionTotals = useMemo(() => {
    if (!previewData || exportAll) {
      return null;
    }

    const selectedCategories = previewData.categories.filter((c) =>
      selectedCategoryIds.has(c.id)
    );

    return {
      folders: selectedCategories.reduce((sum, c) => sum + c.folderCount, 0),
      articles: selectedCategories.reduce((sum, c) => sum + c.articleCount, 0),
      englishPublished: selectedCategories.reduce(
        (sum, c) => sum + c.englishPublishedArticleCount,
        0
      ),
    };
  }, [previewData, selectedCategoryIds, exportAll]);

  // Check if a step's prerequisites are met
  const isStep1Complete = isConfigured;
  const isStep2Complete = exportAll || selectedCategoryIds.size > 0;
  const isStep3Complete =
    outputDir.trim() !== '' &&
    (maxCharsPerFile === '' || parseInt(maxCharsPerFile, 10) > 0) &&
    (languageMode === 'all' || languageMode === 'en');
  const isStep4Complete = jobStatus?.status === 'completed' || jobStatus?.status === 'failed';

  // Determine which steps are unlocked
  const canAccessStep2 = isStep1Complete;
  const canAccessStep3 = isStep1Complete && isStep2Complete;
  const canAccessStep4 = isStep1Complete && isStep2Complete && isStep3Complete;
  const canAccessStep5 = isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;

  // Handle tab navigation with gating
  const handleTabChange = (newIndex: number) => {
    const newStep = newIndex + 1;

    // Clear any previous block message
    setNavigationBlockMessage(null);

    // Always allow going backwards
    if (newStep < currentStep) {
      setCurrentStep(newStep);
      return;
    }

    // Check if forward navigation is allowed
    if (newStep === 2 && !canAccessStep2) {
      setNavigationBlockMessage('Complete Step 1: Configure to continue');
      return;
    }
    if (newStep === 3 && !canAccessStep3) {
      setNavigationBlockMessage('Complete Step 2: Select Scope to continue');
      return;
    }
    if (newStep === 4 && !canAccessStep4) {
      setNavigationBlockMessage('Complete Step 3: Options to continue');
      return;
    }
    if (newStep === 5 && !canAccessStep5) {
      setNavigationBlockMessage('Complete Step 4: Run Export to continue');
      return;
    }

    // Navigation allowed
    setCurrentStep(newStep);
  };

  // Tab steps definition
  const tabSteps = [
    { number: 1, title: 'Configure', unlocked: true },
    { number: 2, title: 'Scope', unlocked: canAccessStep2 },
    { number: 3, title: 'Options', unlocked: canAccessStep3 },
    { number: 4, title: 'Run', unlocked: canAccessStep4 },
    { number: 5, title: 'Results', unlocked: canAccessStep5 },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Block Message */}
      {navigationBlockMessage && (
        <Alert variant="warning">
          <p className="text-sm">{navigationBlockMessage}</p>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tab.Group selectedIndex={currentStep - 1} onChange={handleTabChange}>
        <Tab.List className="flex items-center gap-2">
          {tabSteps.map((step, idx) => (
            <Tab key={step.number} className="flex items-center gap-2 focus:outline-none">
              {({ selected }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : currentStep > step.number
                          ? 'border-green-500 bg-green-500 text-white'
                          : step.unlocked
                          ? 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-600'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        selected
                          ? 'text-blue-600 dark:text-blue-400'
                          : currentStep > step.number
                          ? 'text-green-600 dark:text-green-400'
                          : step.unlocked
                          ? 'text-zinc-600 dark:text-zinc-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < tabSteps.length - 1 && (
                    <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800"></div>
                  )}
                </>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <StepConfigure
              hasApiKey={hasApiKey}
              hasHost={hasHost}
              baseUrl={baseUrl}
              isConfigured={isConfigured}
              onContinue={() => setCurrentStep(2)}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepScope
              previewData={previewData}
              previewLoading={previewLoading}
              previewError={previewError}
              exportAll={exportAll}
              selectedCategoryIds={selectedCategoryIds}
              selectionTotals={selectionTotals}
              setExportAll={setExportAll}
              toggleCategory={toggleCategory}
              toggleSelectAll={toggleSelectAll}
              onContinue={() => setCurrentStep(3)}
              fetchPreview={fetchPreview}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepOptions
              runName={runName}
              setRunName={setRunName}
              outputDir={outputDir}
              setOutputDir={setOutputDir}
              downloadAssets={downloadAssets}
              setDownloadAssets={setDownloadAssets}
              maxCharsPerFile={maxCharsPerFile}
              setMaxCharsPerFile={setMaxCharsPerFile}
              languageMode={languageMode}
              setLanguageMode={setLanguageMode}
              includeTitleAsH1={includeTitleAsH1}
              setIncludeTitleAsH1={setIncludeTitleAsH1}
              normalizeHeadings={normalizeHeadings}
              setNormalizeHeadings={setNormalizeHeadings}
              collapseBlankLines={collapseBlankLines}
              setCollapseBlankLines={setCollapseBlankLines}
              stripEmptySections={stripEmptySections}
              setStripEmptySections={setStripEmptySections}
              onContinue={() => setCurrentStep(4)}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepRun
              jobStatus={jobStatus}
              baseUrl={baseUrl}
              exportAll={exportAll}
              selectedCategoryIds={selectedCategoryIds}
              previewData={previewData}
              selectionTotals={selectionTotals}
              languageMode={languageMode}
              downloadAssets={downloadAssets}
              maxCharsPerFile={maxCharsPerFile}
              outputDir={outputDir}
              runName={runName}
              onStartExport={handleStartExport}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepResults jobStatus={jobStatus} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
