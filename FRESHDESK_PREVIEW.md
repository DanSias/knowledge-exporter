# Freshdesk Solutions Preview Implementation

This document describes the implementation of Step 2 (Scope Selection) for the Knowledge Base Exporter.

## Overview

The preview functionality allows users to:
- View all Freshdesk Solutions categories
- See article counts (total, published, English published)
- Select which categories to export
- Toggle between "export all" and selective export

## Architecture

### Provider Interface (`lib/exporters/types.ts`)

Defines a clean, extensible interface for multiple knowledge base providers:

```typescript
interface ExporterProvider {
  key: string;
  preview(scope?: ExportScope): Promise<PreviewResult>;
}
```

This allows future support for providers like Zendesk, Intercom, etc.

### Freshdesk Connector

Located in `lib/exporters/freshdesk/`:

#### `client.ts`
- **`resolveBaseUrl()`**: Uses existing `checkFreshdeskEnv()` logic
- **`freshdeskFetch()`**: Handles HTTP requests with:
  - Basic authentication: `Authorization: Basic base64(apiKey:X)`
  - No caching (`cache: "no-store"`)
  - Error handling with typed exceptions

#### `api.ts`
Implements Freshdesk Solutions v2 API endpoints:
- `GET /api/v2/solutions/categories`
- `GET /api/v2/solutions/categories/:category_id/folders`
- `GET /api/v2/solutions/folders/:folder_id/articles`

#### `filters.ts`
Pure functions for filtering articles:
- **`isPublished(article)`**: Checks `status === 2`
- **`isEnglish(article)`**: Checks `language === "en"` or `language_code === "en"`
- **`isPublishedEnglish(article)`**: Combined check
- **`computeArticleCounts(articles)`**: Returns total, published, and English published counts

#### `types.ts`
TypeScript interfaces for Freshdesk API responses.

### API Route Handler

**`app/api/export/freshdesk/preview/route.ts`**

GET endpoint that:
1. Validates environment configuration
2. Fetches all categories
3. For each category, fetches folders and articles
4. Computes counts per category
5. Returns structured JSON response

Error handling:
- `400`: Missing environment variables
- `500`: API errors or unexpected failures

### UI Components

**`app/pilot/export/page.tsx`** (Server Component)
- Reads environment configuration server-side
- Passes config to client component

**`app/pilot/export/ExportWizard.tsx`** (Client Component)
- Step progression logic
- Fetches preview data from API route
- Loading/error/success states
- Category selection with checkboxes
- "Export all" toggle
- Real-time article count summaries

## Filtering Logic

Articles are filtered according to these rules:

### Published Status
- **Published**: `status === 2`
- **Draft**: `status === 1`

### Language
- Checks both `language` and `language_code` fields
- Accepts: `"en"`
- **Note**: `language` field takes precedence over `language_code`

### Combined Filter
Only articles that are **both** published AND English are counted in `englishPublishedArticleCount`.

## Testing

Unit tests in `lib/exporters/freshdesk/filters.test.ts`:

```bash
npm test
```

Tests cover:
- ✅ Published status detection
- ✅ English language detection (both fields)
- ✅ Combined published + English logic
- ✅ Article count computation
- ✅ Edge cases (empty arrays, mixed statuses)

All 16 tests pass.

## API Response Format

```json
{
  "baseUrl": "https://rocketgate.freshdesk.com",
  "categories": [
    {
      "id": 123,
      "name": "Getting Started",
      "folderCount": 3,
      "articleCount": 15,
      "publishedArticleCount": 12,
      "englishPublishedArticleCount": 10
    }
  ]
}
```

## Environment Variables

No new variables introduced. Uses existing configuration:

```bash
FRESHDESK_API_KEY=your_api_key_here
FRESHDESK_HOST=rocketgate.freshdesk.com
# OR
FRESHDESK_DOMAIN=rocketgate.freshdesk.com
```

## Manual Testing Steps

1. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Visit the pilot page**:
   ```
   http://localhost:3000/pilot/export
   ```

4. **Expected behavior**:
   - Step 1 shows green checkmarks for configured env vars
   - Click "Continue to Scope Selection"
   - Loading indicator appears
   - Categories load with correct counts
   - Toggle "Export all categories" on/off
   - When off, select individual categories
   - Article counts update in summary

5. **Test error states**:
   - Remove `FRESHDESK_API_KEY` from `.env.local` → Should show 400 error
   - Use invalid API key → Should show auth error
   - Use invalid host → Should show connection error

## Files Added/Changed

### New Files
```
lib/exporters/
├── types.ts                          # Provider interface
└── freshdesk/
    ├── types.ts                      # Freshdesk API types
    ├── client.ts                     # HTTP client with auth
    ├── api.ts                        # API endpoint functions
    ├── filters.ts                    # Article filtering logic
    └── filters.test.ts               # Unit tests (16 tests)

app/api/export/freshdesk/preview/
└── route.ts                          # Preview API route

app/pilot/export/
└── ExportWizard.tsx                  # Client-side wizard component

vitest.config.ts                      # Test configuration
```

### Modified Files
```
app/pilot/export/page.tsx             # Converted to use ExportWizard
package.json                          # Added test scripts
```

## Future Extensibility

The provider interface allows adding new providers easily:

```typescript
class ZendeskProvider implements ExporterProvider {
  key = 'zendesk';
  async preview(scope?: ExportScope): Promise<PreviewResult> {
    // Zendesk-specific implementation
  }
}
```

## Performance Considerations

The preview operation:
- Fetches all categories (typically < 20)
- Fetches folders for each category (parallel)
- Fetches articles for each folder (parallel)

For a typical knowledge base:
- 10 categories × 5 folders × 20 articles = ~100 API calls
- With parallel execution: ~3-5 seconds total

Future optimizations could include:
- Caching preview results (with TTL)
- Pagination for very large knowledge bases
- Incremental loading (show categories first, then fetch counts)

## Next Steps

Step 2 is complete. Remaining work:
- Step 3: Export options (file naming, formatting)
- Step 4: Run export (actual Markdown generation)
- Step 5: Results display and download
