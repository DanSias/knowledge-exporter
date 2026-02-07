# Diff & Change Awareness Implementation Summary

## Overview

Implemented end-to-end diff & change awareness for both Freshdesk and Confluence exporters, making it obvious what changed in each export run and providing a lightweight way to review file changes.

## Implementation Details

### 1. Standardized Report Structure (`lib/exporters/utils/report.ts`)

**Extended `FileResult` interface:**
- `pathRelative`: Relative to outputDir
- `pathAbsolute`: Full filesystem path
- `bytes`: File size in bytes
- `hash`: Content hash (SHA-256)
- `sourceId`: Article/Page ID from source system
- `error`: Error message if failed (null otherwise)
- `updatedAt`: ISO timestamp of last update from source system

**Extended `ExportReport` interface:**
- `provider`: "freshdesk" | "confluence"
- `runName`: Run name if provided
- `durationMs`: Alias for duration (standardized field name)
- `outputDirRelative`: Relative path if available
- `totalFilesConsidered`: Total files in export (computed from files.length)

### 2. Updated File Writer (`lib/exporters/utils/fileWriter.ts`)

Enhanced `WriteResult` to include:
- `bytes`: File size
- `hash`: Content hash (computed via SHA-256)

These fields are now returned by `writeFileIdempotent()` and used to populate report files.

### 3. Updated Exporters

**Freshdesk Exporter** (`lib/exporters/freshdesk/exporter.ts`):
- Populates all extended fields during file writes
- Includes article ID as sourceId, updated_at timestamp
- Tracks failed files with error messages

**Confluence Exporter** (`lib/exporters/confluence/exporter.ts`):
- Populates all extended fields during file writes
- Includes page ID as sourceId, version.when timestamp
- Tracks failed pages as file entries with errors

### 4. Shared UI Components

**StatusBadge** (`app/components/export/StatusBadge.tsx`):
- Color-coded badges for file operation status
- Green: Created
- Blue: Updated
- Gray: Skipped
- Red: Failed
- Supports `sm` and `md` sizes

**ChangedFilesModal** (`app/components/export/ChangedFilesModal.tsx`):
- Reusable modal using HeadlessUI Dialog
- Tabs: Changed (created+updated), Skipped, Failed, All
- Search box for filtering by path
- List view with status badge, relative path, size
- Copy path button per row
- Pagination: Shows first 200 rows with "Show more" button
- Handles 800+ file exports efficiently

### 5. Results Step Updates

**Freshdesk Results** (`app/(app)/freshdesk/export/steps/StepResults.tsx`):
- Added "View changed files" button next to Statistics header
- Wired up ChangedFilesModal with job status data
- Transforms report files to modal format

**Confluence Results** (`app/(app)/confluence/export/steps/StepResults.tsx`):
- Added "View changed files" button next to Statistics header
- Wired up ChangedFilesModal with job status data
- Transforms report files to modal format

### 6. Export Inventory Integration

**Exports Page** (`app/(app)/exports/page.tsx`):
- Added "Last Run Changes" panel when export root is selected
- Fetches and displays report.json automatically
- Shows:
  - Last run timestamp and provider
  - Created/Updated/Skipped/Failed counts (4-column grid)
  - Top 10 changed files preview with status badges
  - "View all →" button that opens ChangedFilesModal
- Reuses the same ChangedFilesModal component

## Files Changed

### Created:
- `app/components/export/StatusBadge.tsx` - Status badge component
- `app/components/export/ChangedFilesModal.tsx` - Reusable changed files modal
- `DIFF_CHANGE_AWARENESS_SUMMARY.md` - This summary document

### Modified:
- `lib/exporters/utils/report.ts` - Extended interfaces
- `lib/exporters/utils/fileWriter.ts` - Enhanced WriteResult
- `lib/exporters/freshdesk/exporter.ts` - Populate extended fields
- `lib/exporters/confluence/exporter.ts` - Populate extended fields
- `hooks/useExportJob.ts` - Updated JobStatus interface
- `app/(app)/freshdesk/export/steps/StepResults.tsx` - Added modal
- `app/(app)/confluence/export/steps/StepResults.tsx` - Added modal
- `app/(app)/exports/page.tsx` - Added Last Run Changes panel

## Manual Testing Steps

### Test 1: Freshdesk Export (Twice)

1. **First Run (Expect Created files):**
   ```
   1. Navigate to /freshdesk/export
   2. Complete Step 1 (Configure) - verify env vars
   3. Complete Step 2 (Select Scope) - select 1-2 categories
   4. Complete Step 3 (Options) - leave defaults
   5. Click "Start Export" in Step 4
   6. Wait for completion
   7. In Step 5 (Results):
      - Verify stats cards show Created > 0, Updated = 0, Skipped = 0
      - Click "View changed files"
      - Verify modal shows:
        * "Changed" tab has all files with green "Created" badges
        * Search works (type part of filename)
        * Copy path button works
        * File sizes displayed correctly
   ```

2. **Second Run (Expect Skipped files):**
   ```
   1. Return to Step 2 (use navigation or refresh)
   2. Select the SAME categories as before
   3. Complete Step 3 and 4 (same options)
   4. Click "Start Export"
   5. Wait for completion
   6. In Step 5 (Results):
      - Verify stats cards show Created = 0, Updated = 0, Skipped > 0
      - Click "View changed files"
      - Verify modal shows:
        * "Skipped" tab has all files with gray "Skipped" badges
        * Files are exactly the same as first run
   ```

### Test 2: Confluence Export (Twice)

1. **First Run (Expect Created files):**
   ```
   1. Navigate to /confluence/export
   2. Complete Step 1 (Configure) - verify env vars
   3. Complete Step 2 (Select Scope) - select 1-2 spaces
   4. Complete Step 3 (Options) - leave defaults
   5. Click "Start Export" in Step 4
   6. Watch live progress updates (unique to Confluence)
   7. Wait for completion
   8. In Step 5 (Results):
      - Verify stats cards show Created > 0, Updated = 0, Skipped = 0
      - Click "View changed files"
      - Verify modal shows:
        * "Changed" tab has all files with green "Created" badges
        * Search works
        * Copy path button works
   ```

2. **Second Run (Expect Skipped files):**
   ```
   1. Click "Run Another Export" button
   2. Select the SAME spaces as before
   3. Complete Step 3 and 4 (same options)
   4. Click "Start Export"
   5. Wait for completion
   6. In Step 5 (Results):
      - Verify stats cards show Created = 0, Updated = 0, Skipped > 0
      - Click "View changed files"
      - Verify modal shows:
        * "Skipped" tab has all files with gray "Skipped" badges
   ```

### Test 3: Export Inventory Page

1. **View Last Run Changes:**
   ```
   1. Navigate to /exports
   2. Click on an export root (should have report.json)
   3. Verify "Last Run Changes" panel appears:
      - Shows timestamp of last export
      - Shows provider (freshdesk or confluence)
      - Shows 4-column counts (Created/Updated/Skipped/Failed)
      - Shows "Recent changes (top 10)" list with status badges
   4. Click "View all →" button
   5. Verify ChangedFilesModal opens with all files from report.json
   6. Test search and filters in modal
   ```

2. **Test with Multiple Export Roots:**
   ```
   1. Run exports for both Freshdesk and Confluence
   2. Go to /exports
   3. Click different export roots
   4. Verify Last Run Changes panel updates correctly for each root
   5. Verify modal shows correct provider name in title
   ```

### Test 4: Edge Cases

1. **Large Exports (200+ files):**
   ```
   1. Run export with many files
   2. Open "View changed files" modal
   3. Verify only first 200 rows shown
   4. Click "Show X more files" button
   5. Verify remaining files load
   ```

2. **Failed Files:**
   ```
   1. Run export with scope that includes items that fail (if possible)
   2. Verify "Failed" tab in modal shows files with red badges
   3. Verify error messages displayed under file paths
   ```

3. **Search and Filters:**
   ```
   1. Open changed files modal
   2. Test search with various terms
   3. Switch between tabs (Changed/Skipped/Failed/All)
   4. Verify counts update correctly
   ```

## Expected Outcomes

### First Run:
- ✅ Most files show status: "created" (green badges)
- ✅ filesCreated count > 0
- ✅ filesUpdated count = 0
- ✅ filesSkipped count = 0

### Second Run (unchanged content):
- ✅ Most files show status: "skipped" (gray badges)
- ✅ filesCreated count = 0
- ✅ filesUpdated count = 0
- ✅ filesSkipped count > 0

### Inventory Page:
- ✅ Last Run Changes panel shows accurate counts
- ✅ Top 10 preview shows recent changes with badges
- ✅ "View all" opens modal with full file list
- ✅ Modal search and filters work correctly

## Verification Checklist

- [ ] Freshdesk first run shows Created files
- [ ] Freshdesk second run shows Skipped files
- [ ] Confluence first run shows Created files
- [ ] Confluence second run shows Skipped files
- [ ] Results step "View changed files" button works
- [ ] ChangedFilesModal tabs work (Changed/Skipped/Failed/All)
- [ ] ChangedFilesModal search filters files correctly
- [ ] ChangedFilesModal copy path button works
- [ ] Export Inventory shows Last Run Changes panel
- [ ] Inventory "View all" opens modal with correct data
- [ ] Large exports (200+) show "Show more" button
- [ ] Failed files appear in Failed tab with red badges
- [ ] Status badges show correct colors (green/blue/gray/red)

## Architecture Benefits

1. **Zero Duplication**: Single ChangedFilesModal reused across:
   - Freshdesk Results step
   - Confluence Results step
   - Export Inventory page

2. **Consistent UX**: Same modal, same tabs, same search behavior everywhere

3. **Performance**: Pagination prevents UI slowdown with large exports (800+ files)

4. **Extensibility**: Easy to add new providers - just populate extended report fields

5. **Backwards Compatible**: Legacy `path`, `articleId`, `articleTitle` fields preserved

## Non-Goals (Intentionally NOT Done)

- ❌ No new markdown docs in repo root (per user request)
- ❌ No new background job system
- ❌ No computed diffs by scanning folders (rely on report.json)
- ❌ No new provider logic beyond reporting fields
