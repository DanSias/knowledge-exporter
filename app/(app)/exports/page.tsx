'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Popover, Dialog } from '@headlessui/react';
import { Alert } from '@/app/components/Alert';
import { Card } from '@/app/components/Card';
import { ChangedFilesModal, type FileEntry } from '@/app/components/export/ChangedFilesModal';
import { StatusBadge } from '@/app/components/export/StatusBadge';

interface ExportRoot {
  name: string;
  modified: string;
  hasReport: boolean;
  hasSummary: boolean;
}

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface TreeStats {
  totalFolders: number;
  totalFiles: number;
  totalMarkdownFiles: number;
  totalSize: number;
  largestFiles: Array<{ path: string; size: number }>;
  recentFiles: Array<{ path: string; modified: string }>;
  hasReport: boolean;
  hasSummary: boolean;
}

interface FileContent {
  content: string;
  size: number;
  modified: string;
}

export default function ExportsInventoryPage() {
  // Left panel: Export roots
  const [roots, setRoots] = useState<ExportRoot[]>([]);
  const [loadingRoots, setLoadingRoots] = useState(true);
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);

  // Middle panel: File tree
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Right panel: File viewer
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  // Report data for Last Run Changes panel
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showChangedFilesModal, setShowChangedFilesModal] = useState(false);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Fetch roots on mount
  useEffect(() => {
    async function fetchRoots() {
      try {
        const response = await fetch('/api/exports/roots');
        if (!response.ok) {
          throw new Error('Failed to fetch export roots');
        }
        const data: ExportRoot[] = await response.json();
        setRoots(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load export roots');
      } finally {
        setLoadingRoots(false);
      }
    }

    fetchRoots();
  }, []);

  // Fetch tree when a root is selected
  async function handleRootClick(rootName: string) {
    if (selectedRoot === rootName) {
      // Deselect
      setSelectedRoot(null);
      setFileTree([]);
      setStats(null);
      setSelectedFilePath(null);
      setFileContent(null);
      setExpandedPaths(new Set());
      return;
    }

    setSelectedRoot(rootName);
    setLoadingTree(true);
    setFileTree([]);
    setStats(null);
    setSelectedFilePath(null);
    setFileContent(null);
    setError(null);
    setExpandedPaths(new Set());

    await refreshTreeAndStats(rootName);
  }

  // Refresh tree and stats (used after delete)
  async function refreshTreeAndStats(rootName: string) {
    setLoadingTree(true);
    try {
      const response = await fetch(`/api/exports/tree?root=${encodeURIComponent(rootName)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch file tree');
      }
      const data = await response.json();
      setFileTree(data.tree || []);
      setStats(data.stats || null);

      // Also fetch report.json if it exists
      if (data.stats?.hasReport) {
        await fetchReport(rootName);
      } else {
        setReportData(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file tree';
      setError(`Failed to load tree for ${rootName}: ${errorMessage}`);
      console.error('Error fetching tree:', err);
    } finally {
      setLoadingTree(false);
    }
  }

  // Fetch report.json for Last Run Changes panel
  async function fetchReport(rootName: string) {
    setLoadingReport(true);
    try {
      const response = await fetch(
        `/api/exports/file?root=${encodeURIComponent(rootName)}&path=report.json`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      const reportContent = JSON.parse(data.content);
      setReportData(reportContent);
    } catch (err) {
      console.error('Failed to load report.json:', err);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  }

  // Fetch file content when a file is clicked
  async function handleFileClick(filePath: string, closePopover?: () => void) {
    // Close popover if provided
    if (closePopover) {
      closePopover();
    }

    if (selectedFilePath === filePath) {
      // Deselect
      setSelectedFilePath(null);
      setFileContent(null);
      setShowRawMarkdown(false);
      return;
    }

    if (!selectedRoot) return;

    setSelectedFilePath(filePath);
    setLoadingFile(true);
    setFileContent(null);
    setError(null);
    setShowRawMarkdown(false);

    try {
      const fullPath = `${selectedRoot}/${filePath}`;
      const response = await fetch(`/api/exports/file?path=${encodeURIComponent(fullPath)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch file');
      }
      const data: FileContent = await response.json();
      setFileContent(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(`Failed to load file ${filePath}: ${errorMessage}`);
      console.error('Error fetching file:', err);
    } finally {
      setLoadingFile(false);
    }
  }

  // Open delete confirmation dialog
  function confirmDelete() {
    if (selectedFilePath) {
      setFileToDelete(selectedFilePath);
      setShowDeleteDialog(true);
    }
  }

  // Delete file
  async function handleDelete() {
    if (!fileToDelete || !selectedRoot) return;

    setDeleting(true);
    setError(null);

    try {
      const fullPath = `${selectedRoot}/${fileToDelete}`;
      const response = await fetch('/api/exports/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: fullPath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to delete file');
      }

      // Success - close dialog, clear preview, refresh tree
      setShowDeleteDialog(false);
      setFileToDelete(null);
      setSelectedFilePath(null);
      setFileContent(null);
      setShowRawMarkdown(false);

      // Refresh tree and stats
      await refreshTreeAndStats(selectedRoot);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(`Failed to delete file: ${errorMessage}`);
      console.error('Error deleting file:', err);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  // Toggle directory expansion
  function toggleExpansion(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  // Render file tree recursively
  function renderFileTree(nodes: FileNode[], depth = 0) {
    return nodes.map((node) => {
      const isExpanded = expandedPaths.has(node.path);
      const isSelected = selectedFilePath === node.path;
      const hasChildren = node.children && node.children.length > 0;

      if (node.type === 'directory') {
        return (
          <div key={node.path}>
            <div
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                isExpanded ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''
              }`}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
              onClick={() => toggleExpansion(node.path)}
            >
              <button className="flex-shrink-0 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                {isExpanded ? '▼' : '▶'}
              </button>
              <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300 font-medium">
                📁 {node.name}
              </span>
              {hasChildren && (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {node.children?.length}
                </span>
              )}
            </div>
            {isExpanded && hasChildren && (
              <div>{renderFileTree(node.children!, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        // File node
        return (
          <div
            key={node.path}
            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
              isSelected ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 12 + 24}px` }}
            onClick={() => handleFileClick(node.path)}
          >
            <span
              className={`flex-1 truncate ${
                isSelected
                  ? 'font-medium text-blue-600 dark:text-blue-400'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {node.name.endsWith('.md') ? '📄' : '📋'} {node.name}
            </span>
            {node.size !== undefined && (
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {formatBytes(node.size)}
              </span>
            )}
          </div>
        );
      }
    });
  }

  // Format bytes to human readable
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // Copy path to clipboard
  function copyPath(path: string) {
    if (selectedRoot) {
      navigator.clipboard.writeText(`${selectedRoot}/${path}`);
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black">
      {/* Compact Stats Header - Fixed height, always present */}
      <div className="flex-shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {!selectedRoot ? (
          // Empty state placeholder
          <div className="px-6 py-6">
            <div className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Select an export root to view statistics
              </p>
            </div>
          </div>
        ) : stats ? (
          // Compact stats display
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedRoot}
              </h1>
              {/* Special files chips */}
              {(stats.hasReport || stats.hasSummary) && (
                <div className="flex gap-2">
                  {stats.hasReport && (
                    <button
                      onClick={() => handleFileClick('report.json')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-950 transition-colors"
                    >
                      📊 report.json
                    </button>
                  )}
                  {stats.hasSummary && (
                    <button
                      onClick={() => handleFileClick('SUMMARY.md')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-950 transition-colors"
                    >
                      📝 SUMMARY.md
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Compact Primary Stats Row with Details Popover */}
            <div className="flex items-stretch gap-3">
              {/* 4 Primary Stat Cards */}
              <Card className="flex-1 p-3">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Folders
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalFolders}
                </div>
              </Card>
              <Card className="flex-1 p-3">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Files
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalFiles}
                </div>
              </Card>
              <Card className="flex-1 p-3">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Markdown
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalMarkdownFiles}
                </div>
              </Card>
              <Card className="flex-1 p-3">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Total Size
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatBytes(stats.totalSize)}
                </div>
              </Card>

              {/* Details Popover Card */}
              <Popover className="relative flex-shrink-0">
                {({ close }) => (
                  <>
                    <Popover.Button
                      as={Card}
                      className="p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors w-24"
                    >
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                        Details
                      </div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ⓘ
                      </div>
                    </Popover.Button>

                    <Popover.Panel className="absolute right-0 top-full mt-2 z-50 w-96">
                      <Card className="p-4 shadow-lg">
                        {/* Largest Files */}
                        {stats.largestFiles.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-2">
                              Largest Files
                            </div>
                            <div className="space-y-1">
                              {stats.largestFiles.slice(0, 5).map((file, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleFileClick(file.path, close)}
                                  className="w-full flex items-center justify-between text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 px-2 py-1.5 rounded transition-colors"
                                >
                                  <span className="truncate flex-1 text-zinc-600 dark:text-zinc-400">
                                    {file.path}
                                  </span>
                                  <span className="ml-2 flex-shrink-0 font-medium text-zinc-500 dark:text-zinc-500">
                                    {formatBytes(file.size)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recently Modified */}
                        {stats.recentFiles.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-2">
                              Recently Modified
                            </div>
                            <div className="space-y-1">
                              {stats.recentFiles.slice(0, 5).map((file, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleFileClick(file.path, close)}
                                  className="w-full flex items-center justify-between text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 px-2 py-1.5 rounded transition-colors"
                                >
                                  <span className="truncate flex-1 text-zinc-600 dark:text-zinc-400">
                                    {file.path}
                                  </span>
                                  <span className="ml-2 flex-shrink-0 font-medium text-zinc-500 dark:text-zinc-500">
                                    {new Date(file.modified).toLocaleDateString()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </Popover.Panel>
                  </>
                )}
              </Popover>
            </div>

            {/* Last Run Changes Panel */}
            {reportData && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Last Run Changes
                  </h3>
                  <button
                    onClick={() => setShowChangedFilesModal(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View all →
                  </button>
                </div>
                <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  {/* Timestamp and counts */}
                  <div className="mb-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      {new Date(reportData.endTime).toLocaleString()}
                    </span>
                    <span className="capitalize">{reportData.provider} export</span>
                  </div>
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Created</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {reportData.counts.filesCreated}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Updated</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {reportData.counts.filesUpdated}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Skipped</div>
                      <div className="text-lg font-bold text-zinc-600 dark:text-zinc-400">
                        {reportData.counts.filesSkipped}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Failed</div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {reportData.counts.filesFailed || 0}
                      </div>
                    </div>
                  </div>
                  {/* Top 10 changed files preview */}
                  {reportData.files && reportData.files.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Recent changes (top 10)
                      </div>
                      <div className="space-y-1">
                        {reportData.files
                          .filter((f: any) => f.status === 'created' || f.status === 'updated')
                          .slice(0, 10)
                          .map((file: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs"
                            >
                              <StatusBadge status={file.status} size="sm" />
                              <span className="flex-1 truncate font-mono text-zinc-600 dark:text-zinc-400">
                                {file.pathRelative || file.path}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Loading state
          <div className="px-6 py-6">
            <div className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading statistics...</p>
            </div>
          </div>
        )}
      </div>

      {/* 3-Panel Explorer - Fills remaining height with internal scrolling */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel: Export Roots */}
        <div className="w-64 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
          <div className="flex-shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Export Roots</h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingRoots && (
              <div className="px-4 py-3 text-sm text-zinc-500">Loading export roots...</div>
            )}
            {!loadingRoots && roots.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  No exports found
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  Run an export to see it here
                </p>
              </div>
            )}
            {roots.map((root) => (
              <div
                key={root.name}
                onClick={() => handleRootClick(root.name)}
                className={`cursor-pointer border-b border-zinc-100 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 transition-colors ${
                  selectedRoot === root.name
                    ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-l-2 border-blue-500'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1 truncate">{root.name}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                  {new Date(root.modified).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: File Tree */}
        <div className="w-96 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
          <div className="flex-shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Files</h2>
              {selectedRoot && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {selectedRoot}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {!selectedRoot && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Select an export root to browse files
                </p>
              </div>
            )}
            {loadingTree && (
              <div className="px-4 py-3 text-sm text-zinc-500">Loading file tree...</div>
            )}
            {!loadingTree && selectedRoot && fileTree.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No files found</p>
              </div>
            )}
            {!loadingTree && fileTree.length > 0 && renderFileTree(fileTree)}
          </div>
        </div>

        {/* Right Panel: File Viewer */}
        <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col min-w-0">
          <div className="flex-shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Preview</h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {error && (
              <div className="p-6">
                <Alert variant="error">{error}</Alert>
              </div>
            )}

            {!selectedFilePath && !error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-500">Select a file to preview</p>
              </div>
            )}

            {loadingFile && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-500">Loading file...</p>
              </div>
            )}

            {!loadingFile && fileContent && selectedFilePath && (
              <div className="p-6">
                {/* Compact File Header */}
                <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 break-words">
                        {selectedFilePath.split('/').pop()}
                      </h1>
                      <p className="mt-1 text-xs text-zinc-500 break-words font-mono">
                        {selectedFilePath}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => copyPath(selectedFilePath)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
                        title="Copy path"
                      >
                        Copy path
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-950 rounded transition-colors"
                        title="Delete file"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {/* Compact metadata row with Raw toggle */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">
                      {formatBytes(fileContent.size)} • Modified {new Date(fileContent.modified).toLocaleDateString()} {new Date(fileContent.modified).toLocaleTimeString()}
                    </div>
                    {selectedFilePath.endsWith('.md') && (
                      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showRawMarkdown}
                          onChange={(e) => setShowRawMarkdown(e.target.checked)}
                          className="rounded"
                        />
                        Raw
                      </label>
                    )}
                  </div>
                </div>

                {/* File Content */}
                {showRawMarkdown || !selectedFilePath.endsWith('.md') ? (
                  <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 whitespace-pre-wrap break-words">
                    {fileContent.content}
                  </pre>
                ) : (
                  <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:text-zinc-800 dark:prose-pre:text-zinc-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {fileContent.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => !deleting && setShowDeleteDialog(false)}
        className="relative z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />

        {/* Dialog Container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Delete file?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Are you sure you want to delete this file? This action cannot be undone.
            </Dialog.Description>

            <div className="mb-6 rounded bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
              <code className="text-xs text-zinc-800 dark:text-zinc-200 break-all">
                {fileToDelete && selectedRoot && `${selectedRoot}/${fileToDelete}`}
              </code>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Changed Files Modal */}
      {reportData && (
        <ChangedFilesModal
          isOpen={showChangedFilesModal}
          onClose={() => setShowChangedFilesModal(false)}
          files={
            reportData.files?.map((f: any) => ({
              pathRelative: f.pathRelative || f.path,
              pathAbsolute: f.pathAbsolute || f.path,
              status: f.status,
              bytes: f.bytes || 0,
              hash: f.hash || null,
              error: f.error || null,
            })) || []
          }
          title={`${selectedRoot} - Export File Changes`}
        />
      )}
    </div>
  );
}
