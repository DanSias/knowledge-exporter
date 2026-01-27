# Pilot UI Setup

## What Was Added

### 1. **Pilot Page** (`/pilot/export`)
Located at: `app/pilot/export/page.tsx`

A server-side rendered page that:
- Displays a 5-step wizard outline (Configure → Scope → Options → Run → Results)
- Implements Step 1 (Configure) with environment variable detection
- Detects presence of `FRESHDESK_API_KEY` and `FRESHDESK_HOST`/`FRESHDESK_DOMAIN`
- Shows resolved base URL when host is present
- Displays appropriate warnings/success messages based on configuration state

### 2. **Shared Components** (`app/components/`)
Reusable UI components following Next.js conventions:

- **`Alert.tsx`** - Alert component with variants (info, warning, error, success)
- **`Card.tsx`** - Card layout components (Card, CardHeader, CardTitle, CardContent)
- **`StepIndicator.tsx`** - Step wizard progress indicator with status tracking

### 3. **Server Utilities** (`lib/`)
Server-side utilities:

- **`lib/env.ts`** - Environment variable detection utility
  - `checkFreshdeskEnv()` - Checks for required env vars and resolves base URL
  - Returns `EnvConfig` with detection status

## Architecture Decisions

### Route Structure
- **App Router** convention: `app/pilot/export/page.tsx` creates `/pilot/export` route
- Future API routes should live in `app/api/` (e.g., `app/api/export/route.ts`)

### Component Organization
- **Shared components**: `app/components/` for reusable UI components
- **Route-specific components**: Could be co-located in route folders when needed
- **Server utilities**: `lib/` for shared server-side logic

### Styling
- **Tailwind CSS v4** with dark mode support
- Consistent color palette using zinc/blue/green/amber/red
- Responsive design with mobile-first approach

### TypeScript
- Path alias `@/*` configured for cleaner imports
- Strict type checking enabled
- Interface definitions for component props

## Environment Variables

The pilot page expects these environment variables (optional for now):

```bash
FRESHDESK_API_KEY=your_api_key_here
FRESHDESK_HOST=yourdomain.freshdesk.com
# OR
FRESHDESK_DOMAIN=yourdomain.freshdesk.com
```

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Then visit: `http://localhost:3000/pilot/export`

## Next Steps

The foundation is ready for implementing:
1. Step 2: Scope selection (category/folder filtering)
2. Step 3: Export options (formatting, file naming, etc.)
3. Step 4: Run export process
4. Step 5: Display results and downloaded files
5. API route handlers in `app/api/` for export operations
6. Shared types in `lib/types.ts` for Freshdesk API responses
