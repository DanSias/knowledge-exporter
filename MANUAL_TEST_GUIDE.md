# Manual Test Guide - Phase 1 Export

## Prerequisites

- Valid Freshdesk account with Solutions articles
- API key with Solutions access
- Node.js and npm installed

## Setup (5 minutes)

```bash
# 1. Clone/navigate to repo
cd /path/to/knowledge-exporter

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Edit .env.local with your credentials
# FRESHDESK_API_KEY=your_actual_api_key
# FRESHDESK_HOST=rocketgate.freshdesk.com

# 5. Verify tests pass
npm test
# Expected: 47/47 tests passing

# 6. Verify build succeeds
npm run build
# Expected: Successful build with no errors

# 7. Start dev server
npm run dev
# Expected: Server running on http://localhost:3000
```

## Test Case 1: Full Export (All Categories)

**Objective**: Verify complete export workflow

### Steps
1. Visit `http://localhost:3000/pilot/export`
2. **Step 1 - Configure**:
   - ✅ Verify `FRESHDESK_API_KEY` shows "✓ Present"
   - ✅ Verify `FRESHDESK_HOST` shows "✓ Present"
   - ✅ Verify resolved base URL is displayed
   - ✅ Click "Continue to Scope Selection"

3. **Step 2 - Scope**:
   - ✅ Wait for categories to load (spinner appears)
   - ✅ Verify categories list appears with article counts
   - ✅ Verify "Export all categories" is checked by default
   - ✅ Note the total English published article count
   - ✅ Click "Continue to Options"

4. **Step 3 - Options**:
   - ✅ Verify output directory shows `./exports/freshdesk-kb`
   - ✅ Verify "Download assets" is unchecked
   - ✅ Leave "Max chars per file" empty
   - ✅ Click "Continue to Run Export"

5. **Step 4 - Run**:
   - ✅ Click "Start Export"
   - ✅ Verify status changes to "Running"
   - ✅ Verify progress counters update (categories/folders/articles)
   - ✅ Verify logs appear in terminal
   - ✅ Wait for completion (status changes to "Completed")
   - ✅ Note the duration

6. **Step 5 - Results**:
   - ✅ Verify "Export completed successfully" message
   - ✅ Verify statistics show counts for created/updated/skipped/failed
   - ✅ Verify output directory path is displayed
   - ✅ Click output path and verify it exists

7. **Filesystem Verification**:
   ```bash
   ls -la ./exports/freshdesk-kb/
   # Expected: report.json, SUMMARY.md, kb/ directory

   ls -la ./exports/freshdesk-kb/kb/
   # Expected: Category directories

   cat ./exports/freshdesk-kb/SUMMARY.md
   # Expected: Human-readable summary with counts

   cat ./exports/freshdesk-kb/report.json | jq .
   # Expected: JSON report with file details
   ```

8. **Content Verification**:
   ```bash
   # Pick a random article
   find ./exports/freshdesk-kb/kb -name "*.md" | head -1 | xargs cat
   # Expected: Clean markdown without HTML tags
   # Expected: No frontmatter (body only)
   # Expected: Headings, lists, code blocks preserved
   ```

### Expected Results
- ✅ All steps complete without errors
- ✅ Files created in `./exports/freshdesk-kb/kb/`
- ✅ Directory structure: `kb/<category>/<folder>/<article>.md`
- ✅ `report.json` and `SUMMARY.md` exist
- ✅ Created count > 0, Failed count = 0

---

## Test Case 2: Idempotency (Re-run Export)

**Objective**: Verify files are skipped when unchanged

### Steps
1. Complete Test Case 1 first
2. Note the "Files Created" count from Step 5
3. **Without changing anything in Freshdesk**, return to Step 4
4. Click "Start Export" again
5. Wait for completion

### Expected Results
- ✅ Status: "Completed"
- ✅ Files Created: 0
- ✅ Files Skipped: (equals previous "Files Created" count)
- ✅ Files Updated: 0
- ✅ Duration: Much faster (no actual writes)

### Verification
```bash
# Check file timestamps - should be unchanged
ls -lt ./exports/freshdesk-kb/kb/*/*/*md | head -5
# Expected: All timestamps from first export
```

---

## Test Case 3: Content Update Detection

**Objective**: Verify changed files are updated

### Steps
1. Complete Test Case 2
2. Go to Freshdesk admin
3. Find one published English article
4. Edit the article content (change some text)
5. Save the article in Freshdesk
6. Return to `/pilot/export` in browser
7. Navigate to Step 4 and click "Start Export"
8. Wait for completion

### Expected Results
- ✅ Status: "Completed"
- ✅ Files Updated: 1
- ✅ Files Skipped: (all others)
- ✅ Files Created: 0

### Verification
```bash
# Find the updated file (newest timestamp)
ls -lt ./exports/freshdesk-kb/kb/*/*/*md | head -1
# Expected: Recent timestamp (just now)

# Check content matches your edit
cat <path_to_updated_file>
# Expected: Contains your recent changes
```

---

## Test Case 4: Selective Export (Specific Categories)

**Objective**: Verify category selection works

### Steps
1. Visit `/pilot/export`
2. Navigate to Step 2
3. **Uncheck** "Export all categories"
4. Select **only 1 or 2 categories** (click checkboxes)
5. Note the "X selected" count
6. Click "Continue to Options"
7. In Step 3, **change output directory** to `./exports/test-selective`
8. Click "Continue to Run Export"
9. Click "Start Export"
10. Wait for completion

### Expected Results
- ✅ Only selected categories processed
- ✅ Article count matches selected categories only
- ✅ Output in `./exports/test-selective/`

### Verification
```bash
ls ./exports/test-selective/kb/
# Expected: Only the selected category directories

# Count categories
ls ./exports/test-selective/kb/ | wc -l
# Expected: 1 or 2 (matches your selection)
```

---

## Test Case 5: File Splitting

**Objective**: Verify large files split correctly

### Steps
1. Visit `/pilot/export`
2. Navigate to Step 3
3. Set "Max chars per file" to `5000`
4. Complete export
5. Search for articles longer than 5000 characters

### Expected Results
- ✅ Large articles split into multiple parts
- ✅ Files named: `article.md`, `article-part-002.md`, `article-part-003.md`
- ✅ Each part under 5000 characters (approximately)

### Verification
```bash
# Find split files
find ./exports/freshdesk-kb -name "*-part-*.md"
# Expected: List of split files

# Check file sizes
find ./exports/freshdesk-kb -name "*-part-*.md" -exec wc -c {} \;
# Expected: Each file < 5000 bytes (roughly)

# Verify sequence
ls ./exports/freshdesk-kb/kb/*/*/article*.md
# Expected: article.md, article-part-002.md, article-part-003.md, etc.
```

---

## Test Case 6: Error Handling (Invalid API Key)

**Objective**: Verify graceful error handling

### Steps
1. Stop dev server
2. Edit `.env.local` and set `FRESHDESK_API_KEY=invalid_key_123`
3. Restart dev server: `npm run dev`
4. Visit `/pilot/export`
5. Navigate to Step 4
6. Click "Start Export"

### Expected Results
- ✅ Status changes to "Failed"
- ✅ Error message displayed in red alert
- ✅ Error mentions authentication or API key
- ✅ No files created

### Cleanup
```bash
# Restore valid API key in .env.local
# Restart dev server
```

---

## Test Case 7: Step Navigation (Edit Previous Steps)

**Objective**: Verify step navigation works

### Steps
1. Navigate through all 5 steps to completion
2. From Step 5, click "Edit" button on Step 2 card
3. Verify you can change category selection
4. Click "Edit" on Step 3
5. Verify you can change options
6. Change output directory to `./exports/test-navigation`
7. Navigate forward to Step 4
8. Run export
9. Verify new output directory is used

### Expected Results
- ✅ Can navigate back to previous steps
- ✅ Changes persist
- ✅ New export uses updated settings
- ✅ Output in new directory

---

## Test Case 8: Empty Export (No Published Articles)

**Objective**: Verify behavior with no matching articles

### Steps
1. Select a category with no published English articles (if available)
2. Or temporarily unpublish all articles in a category
3. Run selective export with that category only
4. Wait for completion

### Expected Results
- ✅ Status: "Completed"
- ✅ Articles Processed: 0
- ✅ Files Created: 0
- ✅ No error
- ✅ `report.json` and `SUMMARY.md` still created

---

## Performance Benchmarks

Document these for your knowledge base:

| Metric | Expected Value |
|--------|---------------|
| Categories loaded (Step 2) | < 5 seconds |
| Export start (Step 4) | < 1 second |
| Articles per minute | ~50-100 |
| 100 articles total time | 1-2 minutes |
| Re-run (all skipped) | < 30 seconds |
| UI poll interval | 1 second |
| Log display | Last 20 entries |

---

## Troubleshooting

### Categories won't load (Step 2)
1. Check browser console for errors
2. Check dev server logs
3. Verify API key has Solutions access
4. Try manually: `curl -u "$FRESHDESK_API_KEY:X" https://$FRESHDESK_HOST/api/v2/solutions/categories`

### Export stays "Running" forever
1. Check dev server logs for errors
2. Check if background job crashed
3. Restart dev server
4. Try again with smaller scope (1 category)

### Files not appearing on disk
1. Check output directory path is valid
2. Check disk space: `df -h`
3. Check permissions: `ls -la ./exports/`
4. Check `report.json` for failed files

### Content looks wrong
1. Verify HTML-to-Markdown conversion
2. Check source article in Freshdesk
3. View raw .md file: `cat ./exports/.../article.md`
4. Report issue if markdown malformed

---

## Success Criteria

All test cases should pass with:
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ No failed articles (unless expected)
- ✅ Correct file counts
- ✅ Deterministic output
- ✅ Idempotent re-runs
- ✅ Clean markdown files
- ✅ Valid JSON reports

---

## Cleanup After Testing

```bash
# Remove test exports
rm -rf ./exports/

# Keep .env.local for future testing
# Or delete: rm .env.local
```

---

## Reporting Issues

If any test fails, capture:
1. Test case number
2. Step where failure occurred
3. Error message (browser console + server logs)
4. `report.json` contents (if available)
5. Expected vs actual behavior
6. Screenshots of UI state

---

**Total Test Time**: ~30-45 minutes for all test cases
**Quick Smoke Test**: Cases 1, 2, 4 (~15 minutes)
