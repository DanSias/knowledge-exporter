# Export Debug & Fix Guide

## Issues Fixed

### 1. ✅ Missing Pagination
**Problem**: `listArticles()` wasn't paginating, missing articles beyond first page (default 30)
**Fix**: Implemented pagination with `page` and `per_page` parameters (max 100 per page)

### 2. ✅ Too Strict Language Filtering
**Problem**: `isPublishedEnglish` filtered out all articles (English count = 0 in tenant)
**Fix**: Added `languageMode` option ('all' | 'en'), default 'all' to export all published articles

### 3. ✅ No Debug Logging
**Problem**: Zero visibility into why articles weren't being exported
**Fix**: Added comprehensive logging to `report.logs` for debugging

### 4. ✅ Empty Article Handling
**Problem**: Articles with no content would fail silently
**Fix**: Write minimal file with title + note if body is empty, log warning

## Changes Made

### Modified Files (4)

#### 1. `lib/exporters/freshdesk/api.ts`
**Change**: Added pagination to `listArticles()`
```typescript
export async function listArticles(folderId: number): Promise<FreshdeskArticle[]> {
  const allArticles: FreshdeskArticle[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const articles = await freshdeskFetch<FreshdeskArticle[]>(
      `/api/v2/solutions/folders/${folderId}/articles?page=${page}&per_page=${perPage}`
    );

    if (!articles || articles.length === 0) break;
    allArticles.push(...articles);
    if (articles.length < perPage) break;
    page++;
  }

  return allArticles;
}
```

#### 2. `lib/exporters/types.ts`
**Change**: Added `languageMode` to ExportOptions
```typescript
export interface ExportOptions {
  outputDir: string;
  downloadAssets: boolean;
  maxCharsPerFile?: number;
  languageMode?: 'all' | 'en'; // NEW
}
```

#### 3. `lib/exporters/freshdesk/exporter.ts`
**Changes**:
- Use `languageMode` instead of hardcoded `isPublishedEnglish`
- Added comprehensive debug logging
- Handle empty article bodies
- Log first 3 articles per folder for debugging

**Key logging points**:
```typescript
report.logs.push(`Language mode: ${languageMode}`);
report.logs.push(`Processing category: ${category.name} (ID: ${category.id})`);
report.logs.push(`  Found ${folders.length} folders in category ${category.name}`);
report.logs.push(`  Processing folder: ${folder.name} (ID: ${folder.id})`);
report.logs.push(`    Fetched ${articles.length} articles from API`);
report.logs.push(`    Sample articles (first ${sampleSize}):`);
// ... detailed article info
report.logs.push(`    After published filter: ${publishedArticles.length} articles`);
report.logs.push(`    After English filter: ${articlesToExport.length} articles`);
```

#### 4. `lib/exporters/utils/report.ts`
**Changes**:
- Added `languageMode` to options
- Added `logs: string[]` to ExportReport
- Updated `createReport` to accept languageMode
- Updated `writeSummaryMarkdown` to include logs section

#### 5. `app/pilot/export/ExportWizard.tsx`
**Changes**:
- Added `languageMode` state (default: 'all')
- Added language filter UI in Step 3 (radio buttons: All / English only)
- Updated step3Summary to include language mode
- Pass languageMode to API

## Manual Testing Steps

### Test 1: Export with Default Settings (All Languages)

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to export wizard
open http://localhost:3000/pilot/export

# 3. Complete wizard
Step 1: Verify environment configured → Continue
Step 2: Select ONE category (e.g., "Glossary") → Continue
Step 3: Keep default "All languages" selected → Continue
Step 4: Start Export → Wait for completion

# 4. Verify results
cd exports/freshdesk-kb

# Check structure
ls -R kb/
# Should see: kb/<category>/<folder>/<article>.md files

# Check report
cat report.json
# Verify: articlesProcessed > 0, filesCreated > 0

# Check summary with logs
cat SUMMARY.md
# Should see:
# - Articles Processed: X (not 0)
# - Files Created: Y (not 0)
# - Export Logs section with detailed debugging info

# 5. Check logs for debugging info
grep "Fetched" SUMMARY.md
# Should show: "Fetched X articles from API"

grep "Sample articles" SUMMARY.md
# Should show article IDs, titles, status, language

grep "After published filter" SUMMARY.md
# Should show how many passed published filter

# 6. Verify markdown files exist
find kb/ -name "*.md" | head -5
# Should list actual markdown files

# 7. Check a markdown file
cat kb/glossary/quick-start/getting-started.md
# Should contain markdown content (not empty)
```

---

### Test 2: Verify Pagination Works

```bash
# Test with a folder that has >100 articles (if available)
# Or verify in logs that pagination happened

grep "page=" ~/.claude/logs/*
# OR check network requests if using browser DevTools

# In SUMMARY.md logs, should see multiple "Fetched X articles"
# if a folder had >100 articles
```

---

### Test 3: Test English-Only Mode

```bash
# 1. In Step 3, select "English only" radio button
# 2. Start export
# 3. Check SUMMARY.md logs:

grep "Language mode: en" SUMMARY.md
# Should see: Language mode: en

grep "After English filter" SUMMARY.md
# Should see filtered counts (might be 0 if no English articles)
```

---

### Test 4: Debug Why Articles Dropped

```bash
# If articlesProcessed is still 0, check logs:

cat SUMMARY.md | grep -A 5 "Sample articles"
# Shows first 3 articles with: ID, title, status, language

cat SUMMARY.md | grep "After.*filter"
# Shows counts after each filter

# Example output:
#   Fetched 36 articles from API
#   Sample articles (first 3):
#     - ID: 123, Title: "Getting Started", Status: 2, Language: en, Updated: 2024-01-15
#     - ID: 124, Title: "Installation", Status: 2, Language: en, Updated: 2024-01-16
#     - ID: 125, Title: "FAQ", Status: 1, Language: en, Updated: 2024-01-17
#   After published filter: 35 articles  (1 draft removed)
#   After English filter: 35 articles    (all were English)
```

---

### Test 5: Verify Empty Article Handling

```bash
# If an article has no content:

grep "Warning.*no content" SUMMARY.md
# Should see: Warning: Article "X" (ID: Y) has no content

# Check the file was still created
find kb/ -name "*.md" -exec grep -l "Note: This article has no content" {} \;
# Should list files with minimal content
```

---

## Expected Output Structure

```
exports/freshdesk-kb/
├── kb/
│   └── glossary/              (category slug)
│       ├── quick-start/       (folder slug)
│       │   ├── getting-started.md
│       │   ├── installation.md
│       │   └── configuration.md
│       └── troubleshooting/
│           └── common-issues.md
├── report.json                (machine-readable)
└── SUMMARY.md                 (human-readable + logs)
```

## Common Issues & Solutions

### Issue: Still 0 articles processed
**Check**:
1. Look at logs: `grep "Fetched" SUMMARY.md`
2. If "Fetched 0 articles", the folder is truly empty
3. If "Fetched X articles" but "After published filter: 0", all are drafts (status ≠ 2)
4. If "After English filter: 0" but "After published filter: X", change to "All languages"

### Issue: articlesProcessed > 0 but filesCreated = 0
**Check**:
1. Look for errors in logs: `grep "Error" SUMMARY.md`
2. Check filesFailed count in report.json
3. Verify output directory exists and is writable

### Issue: Markdown files are empty
**Check**:
1. Look for "no content" warnings in logs
2. Verify article HTML body exists in Freshdesk
3. Check if htmlToMarkdown is working (might be stripping all content)

### Issue: Language codes not detected
**Check logs for sample articles**:
```bash
grep "Language:" SUMMARY.md
```
If all show `Language: null`, Freshdesk may not be returning language fields.
Use "All languages" mode.

## Debug Checklist

Before asking for help, verify:

- [ ] Environment variables set (FRESHDESK_API_KEY, FRESHDESK_DOMAIN)
- [ ] Selected at least one category with folders and articles
- [ ] Language mode set to "All languages" (recommended)
- [ ] Check SUMMARY.md exists in output directory
- [ ] Read the "Export Logs" section in SUMMARY.md
- [ ] Verify folder counts: `ls -R kb/` shows directories
- [ ] Verify file counts: `find kb/ -name "*.md" | wc -l`
- [ ] Check for errors: `grep -i error SUMMARY.md`

## Summary of Fixes

| Issue | Before | After |
|-------|--------|-------|
| Pagination | Only first 30 articles | All articles (paginated) |
| Language filter | Always English only (0 results) | Configurable: All or English |
| Logging | No visibility | Detailed logs in SUMMARY.md |
| Empty articles | Silent failure | Minimal file + warning |
| Default language | English (bad default) | All (better default) |

---

**Status**: ✅ Export should now work and create markdown files
**Next**: Run Test 1 to verify export creates files
