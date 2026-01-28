# UX Polish Manual Testing Guide

## Overview
This guide covers manual testing for the collapsible step improvements, totals display, and live selection counts in the export wizard.

## Setup

```bash
# 1. Ensure environment variables are set
export FRESHDESK_API_KEY="your_api_key"
export FRESHDESK_DOMAIN="your_domain"

# 2. Start dev server
npm run dev

# 3. Open browser
open http://localhost:3000/pilot/export
```

## Test Suite

### Test 1: Step 1 Collapse Behavior
**Objective**: Verify Step 1 collapses when moving to Step 2

**Steps**:
1. Navigate to `/pilot/export`
2. Observe Step 1 is expanded (shows environment detection details)
3. Click "Continue to Select Scope" button
4. **Expected**: Step 1 collapses and shows:
   - Green checkmark (✓)
   - "Show details" button (not "Hide details")
   - Summary: "Environment configured: [your-domain].freshdesk.com"
5. Click "Show details" on Step 1
6. **Expected**: Step 1 expands showing full environment details
7. Click "Hide details"
8. **Expected**: Step 1 collapses back to summary view

**Pass/Fail**: ☐

---

### Test 2: Step 2 Totals Display (Export All Mode)
**Objective**: Verify totals display correctly in "Export all categories" card

**Steps**:
1. Ensure you're on Step 2 (Select Scope)
2. Observe the "Export all categories" card (default selection)
3. **Expected**: Card shows:
   - Radio button selected
   - "Export all categories" as title
   - Gray text showing: "X categories • Y folders • Z articles • W English published"
   - Example: "5 categories • 42 folders • 318 articles • 290 English published"
4. Verify numbers match your Freshdesk instance totals

**Pass/Fail**: ☐

---

### Test 3: Step 2 Live Selection Counts
**Objective**: Verify selection counts update live when toggling category checkboxes

**Steps**:
1. On Step 2, click "Select specific categories" radio button
2. **Expected**: Right side shows "0 selected: 0 folders, 0 articles (0 English published)"
3. Check the first category checkbox
4. **Expected**: Count updates immediately, e.g., "1 selected: 8 folders, 45 articles (42 English published)"
5. Check a second category checkbox
6. **Expected**: Count updates to show sum of both categories
7. Uncheck the first category
8. **Expected**: Count updates to show only second category's totals
9. Check all categories
10. **Expected**: Totals should match the "Export all" totals from Test 2

**Pass/Fail**: ☐

---

### Test 4: Step 2 Collapse Behavior
**Objective**: Verify Step 2 collapses when moving to Step 3

**Steps**:
1. On Step 2, select "Export all categories"
2. Click "Continue to Configure Export" button
3. **Expected**: Step 2 collapses and shows:
   - Green checkmark (✓)
   - "Show details" button
   - Summary: "Export all 5 categories (290 articles)" (numbers will vary)
4. Click "Show details" on Step 2
5. **Expected**: Step 2 expands showing full category selection UI
6. Click "Hide details"
7. **Expected**: Step 2 collapses back to summary

**Pass/Fail**: ☐

---

### Test 5: Step 2 Summary (Selected Categories Mode)
**Objective**: Verify correct summary for partial selection

**Steps**:
1. Click "Back to Select Scope" from Step 3
2. Select "Select specific categories"
3. Check 2 out of 5 categories (for example)
4. Note the selection count (e.g., "2 selected: 15 folders, 120 articles (110 English published)")
5. Click "Continue to Configure Export"
6. **Expected**: Step 2 summary shows: "Exporting 2 categories (110 articles)"
7. Verify the article count matches the English published count from selection

**Pass/Fail**: ☐

---

### Test 6: Step 3 Configuration and Collapse
**Objective**: Verify Step 3 configuration options and collapse behavior

**Steps**:
1. On Step 3 (Configure Export), observe form fields:
   - Output directory (default: `./exports/freshdesk-kb`)
   - Checkbox: "Download images and assets from articles"
   - Optional: Max characters per file
2. Toggle the "Download images" checkbox
3. **Expected**: Checkbox responds immediately
4. Enter a custom max characters value (e.g., 50000)
5. Click "Start Export" button
6. **Expected**: Step 3 collapses and shows:
   - Green checkmark (✓)
   - "Show details" button
   - Summary showing chosen options

**Pass/Fail**: ☐

---

### Test 7: Navigation Between Steps
**Objective**: Verify steps expand when navigating backward

**Steps**:
1. Complete Steps 1-3 (all collapsed)
2. Click "Back to Configure Export" from Step 4
3. **Expected**: Step 3 expands (isActive=true, no collapse)
4. Step 4 disappears (future step)
5. Click "Back to Select Scope" from Step 3
6. **Expected**: Step 2 expands, Step 3 disappears
7. Click "Continue to Configure Export"
8. **Expected**: Step 2 collapses, Step 3 expands

**Pass/Fail**: ☐

---

### Test 8: Accessibility (Keyboard Navigation)
**Objective**: Verify keyboard accessibility for collapsible steps

**Steps**:
1. Navigate to Step 2 (collapsed Step 1)
2. Press Tab until "Show details" button on Step 1 is focused
3. Press Enter
4. **Expected**: Step 1 expands
5. Verify aria-expanded attribute changes (check DevTools):
   - Collapsed: `aria-expanded="false"`
   - Expanded: `aria-expanded="true"`
6. Press Enter again
7. **Expected**: Step 1 collapses

**Pass/Fail**: ☐

---

### Test 9: Dark Mode Compatibility
**Objective**: Verify collapsible steps work correctly in dark mode

**Steps**:
1. Toggle system dark mode (or use DevTools)
2. Navigate through Steps 1-3
3. **Expected**: All steps render with proper dark mode colors:
   - Collapsed summaries readable (zinc-400)
   - "Show details" button visible (blue-400)
   - Checkmarks visible (green-400)
4. Toggle steps open/closed
5. **Expected**: No color contrast issues

**Pass/Fail**: ☐

---

### Test 10: Edge Case - No Categories Selected
**Objective**: Verify error handling when no categories selected

**Steps**:
1. On Step 2, select "Select specific categories"
2. Leave all checkboxes unchecked
3. Click "Continue to Configure Export"
4. **Expected**: Error message appears: "Please select at least one category"
5. Selection count shows: "0 selected: 0 folders, 0 articles (0 English published)"
6. Step does not advance

**Pass/Fail**: ☐

---

## Visual Checklist

For each collapsed step, verify:

### Step 1 (Collapsed)
- [ ] Shows "Step 1: Check Environment" with checkmark
- [ ] "Show details" button aligned right
- [ ] Summary: "Environment configured: [domain].freshdesk.com"
- [ ] Summary text is gray (zinc-600/zinc-400)

### Step 2 (Collapsed, Export All)
- [ ] Shows "Step 2: Select Scope" with checkmark
- [ ] Summary: "Export all X categories (Y articles)"
- [ ] Numbers match preview totals

### Step 2 (Collapsed, Selected Categories)
- [ ] Summary: "Exporting X categories (Y articles)"
- [ ] Article count matches English published count from selection

### Step 3 (Collapsed)
- [ ] Shows "Step 3: Configure Export" with checkmark
- [ ] Summary lists chosen options:
  - Output directory
  - "Download assets" or "Skip assets"
  - Max chars if set

---

## Performance Check

```bash
# Check for console errors
# Open DevTools Console while testing
# Expected: No errors or warnings

# Check Network tab
# Expected: Preview API call returns 200 OK with totals object

# Check React DevTools
# Expected: No unnecessary re-renders when toggling show/hide
```

---

## API Response Verification

### Test: Preview Endpoint Returns Totals
**Objective**: Verify `/api/export/freshdesk/preview` returns totals

**Steps**:
1. Open DevTools Network tab
2. Navigate to `/pilot/export`
3. Click "Continue to Select Scope" to trigger preview fetch
4. Find the `preview` API call
5. Click to view response
6. **Expected**: Response includes `totals` object:
   ```json
   {
     "baseUrl": "https://example.freshdesk.com",
     "categories": [...],
     "totals": {
       "categoryCount": 5,
       "folderCount": 42,
       "articleCount": 318,
       "publishedArticleCount": 290,
       "englishPublishedArticleCount": 290
     }
   }
   ```

**Pass/Fail**: ☐

---

## Common Issues

### Issue: Selection count stuck at 0
**Symptom**: Checking categories doesn't update the count
**Fix**: Verify `useMemo` dependencies include `selectedCategoryIds`
**Check**: `/app/pilot/export/ExportWizard.tsx` line ~170

### Issue: Step doesn't collapse after clicking Continue
**Symptom**: Step remains expanded when it should collapse
**Fix**: Verify `currentStep` state updates correctly
**Check**: Step rendering logic uses `isActive={currentStep === X}`

### Issue: "Show details" button doesn't work
**Symptom**: Clicking toggle doesn't expand step
**Fix**: Verify `StepPanel` component's `showDetails` state
**Check**: `/app/components/StepPanel.tsx` line 21

### Issue: Totals don't display in "Export all" card
**Symptom**: Card shows "Export all categories" but no totals
**Fix**: Verify preview API returns `totals` object
**Check**: `/app/api/export/freshdesk/preview/route.ts` line 48

---

## Success Criteria

All tests should pass with:
- ✅ Steps collapse when completed
- ✅ "Show details"/"Hide details" toggle works
- ✅ Totals display correctly in "Export all" mode
- ✅ Selection counts update live when checking categories
- ✅ Summaries show accurate information
- ✅ Navigation between steps works correctly
- ✅ Keyboard accessibility works
- ✅ Dark mode compatible
- ✅ No console errors
- ✅ Preview API returns totals

---

## Screenshot Checklist

Capture screenshots for documentation:

1. **Step 1 expanded** - Environment detection UI
2. **Step 1 collapsed** - With summary and "Show details"
3. **Step 2 "Export all" mode** - Showing totals
4. **Step 2 selection mode** - With 2 categories checked and live counts
5. **Step 2 collapsed (export all)** - Summary view
6. **Step 2 collapsed (selected)** - Summary with partial selection
7. **All steps 1-3 collapsed** - Overview of wizard progress
8. **Dark mode** - Any collapsed step in dark mode

---

**Status**: Ready for manual testing. Run through all tests and mark Pass/Fail.
**Expected Duration**: 15-20 minutes for complete test suite.
