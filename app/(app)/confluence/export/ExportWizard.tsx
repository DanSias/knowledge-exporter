'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { Alert } from '@/app/components/Alert';
import { useExportJob } from '@/hooks/useExportJob';
import { StepConfigure } from './steps/StepConfigure';
import { StepScope } from './steps/StepScope';
import { StepOptions } from './steps/StepOptions';
import { StepRun } from './steps/StepRun';
import { StepResults } from './steps/StepResults';

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


interface ExportWizardProps {
  hasSite: boolean;
  hasEmail: boolean;
  hasApiToken: boolean;
  siteUrl: string | null;
}

export function ExportWizard({ hasSite, hasEmail, hasApiToken, siteUrl }: ExportWizardProps) {
  const isConfigured = hasSite && hasEmail && hasApiToken;

  // State for step progression
  const [currentStep, setCurrentStep] = useState<number>(isConfigured ? 2 : 1);

  // State for preview data
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Page counts removed - not needed for export scope selection

  // State for scope selection (Step 2)
  const [exportAll, setExportAll] = useState(true);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());
  const [showPersonalSpaces, setShowPersonalSpaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for navigation blocking
  const [navigationBlockMessage, setNavigationBlockMessage] = useState<string | null>(null);

  // State for options (Step 3)
  const [outputDir, setOutputDir] = useState('./exports');
  const [runName, setRunName] = useState('');
  const [downloadAssets, setDownloadAssets] = useState(false);
  const [maxCharsPerFile, setMaxCharsPerFile] = useState('');

  // Job management
  const { jobStatus, startJob, resetJob } = useExportJob('confluence');

  // Define fetchPreview (no longer fetches counts)
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/confluence/preview');

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
  }, []);

  // Fetch preview when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !previewData && !previewLoading && !previewError) {
      fetchPreview();
    }
  }, [currentStep, previewData, previewLoading, previewError, fetchPreview]);

  // Auto-advance to results when job completes
  useEffect(() => {
    if ((jobStatus?.status === 'completed' || jobStatus?.status === 'failed') && currentStep === 4) {
      setCurrentStep(5);
    }
  }, [jobStatus?.status, currentStep]);

  const handleStartExport = async () => {
    try {
      const scope = {
        exportAll,
        spaceIds: exportAll ? [] : Array.from(selectedSpaceIds),
      };

      const options = {
        outputDir,
        runName: runName || undefined,
        downloadAssets,
        maxCharsPerFile: maxCharsPerFile ? parseInt(maxCharsPerFile, 10) : undefined,
      };

      await startJob(scope, options);
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to start export:', error);
      alert('Failed to start export: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRunAnother = () => {
    setCurrentStep(2);
    resetJob();
  };

  const toggleSpace = (spaceId: string) => {
    const newSet = new Set(selectedSpaceIds);
    if (newSet.has(spaceId)) {
      newSet.delete(spaceId);
    } else {
      newSet.add(spaceId);
    }
    setSelectedSpaceIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!filteredSpaces) return;

    if (selectedSpaceIds.size === filteredSpaces.length) {
      setSelectedSpaceIds(new Set());
    } else {
      setSelectedSpaceIds(new Set(filteredSpaces.map((s) => s.id)));
    }
  };

  // Filter spaces based on personal spaces toggle and search query
  const filteredSpaces = useMemo(() => {
    return (
      previewData?.spaces.filter((space) => {
        // Filter by personal spaces toggle
        if (!showPersonalSpaces && space.type === 'personal') {
          return false;
        }
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            space.name.toLowerCase().includes(query) || space.key.toLowerCase().includes(query)
          );
        }
        return true;
      }) || []
    );
  }, [previewData, showPersonalSpaces, searchQuery]);

  // Check if a step's prerequisites are met
  const isStep1Complete = isConfigured;
  const isStep2Complete = exportAll || selectedSpaceIds.size > 0;
  const isStep3Complete =
    outputDir.trim() !== '' && (maxCharsPerFile === '' || parseInt(maxCharsPerFile, 10) > 0);
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
              hasSite={hasSite}
              hasEmail={hasEmail}
              hasApiToken={hasApiToken}
              siteUrl={siteUrl}
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
              selectedSpaceIds={selectedSpaceIds}
              showPersonalSpaces={showPersonalSpaces}
              searchQuery={searchQuery}
              filteredSpaces={filteredSpaces}
              setExportAll={setExportAll}
              toggleSpace={toggleSpace}
              toggleSelectAll={toggleSelectAll}
              setShowPersonalSpaces={setShowPersonalSpaces}
              setSearchQuery={setSearchQuery}
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
              onContinue={() => setCurrentStep(4)}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepRun
              jobStatus={jobStatus}
              siteUrl={siteUrl}
              exportAll={exportAll}
              selectedSpaceIds={selectedSpaceIds}
              previewData={previewData}
              downloadAssets={downloadAssets}
              maxCharsPerFile={maxCharsPerFile}
              outputDir={outputDir}
              runName={runName}
              onStartExport={handleStartExport}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StepResults jobStatus={jobStatus} onRunAnother={handleRunAnother} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
