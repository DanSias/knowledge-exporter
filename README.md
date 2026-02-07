# Knowledge Exporter

Export support and internal knowledge bases into clean, deterministic Markdown files for downstream use.

Knowledge Exporter is a UI-first tool for extracting content from platforms like Freshdesk Solutions and Confluence, producing portable Markdown suitable for documentation systems, search, AI tooling, or version control.

---

## What It Does

Knowledge Exporter connects to supported knowledge platforms and exports content to a local folder as deterministic, idempotent Markdown.

It is designed to sit upstream of tools like Verbatim, Google Drive, Git, or internal documentation systems.

Typical use cases:

- Preparing knowledge for AI / RAG systems
- Auditing and pruning existing KB content
- Migrating between platforms
- Version-controlling knowledge bases
- Reviewing what changed since the last export

What it intentionally does NOT do:

- Ingestion, indexing, or search
- AI summarization or rewriting
- Cloud sync or automation

Those are left to downstream tools.

---

## Supported Providers

- Freshdesk Solutions
- Confluence Cloud
- Zendesk, Intercom (planned)

---

## Key Features

- Deterministic output  
  Stable paths and filenames (e.g. `kb/<category>/<folder>/<slug>.md`)

- Idempotent exports  
  Skip unchanged files, update modified content, clear reporting

- Markdown quality controls (opt-in)  
  Include title as H1, normalize headings, collapse blank lines, strip empty sections

- Pre-export estimates  
  Scope summary, expected file counts, truncation warnings

- Diff-aware results  
  Review created, updated, skipped, and failed files per run

- Local inventory explorer  
  Browse exports, view Markdown, prune files before upload

- UI-first workflow  
  No CLI required, guided export steps

---

## Quick Start

1. Install dependencies  
   `npm install`

2. Configure environment  
   `cp .env.example .env.local`  
   Edit `.env.local` with your credentials

3. Start the dev server  
   `npm run dev`

4. Open the app  
   http://localhost:3000

Choose a provider from the home page and follow the export steps.

---

## Environment Variables

Required (per provider):

Freshdesk:

- FRESHDESK_API_KEY
- FRESHDESK_HOST (e.g. yourcompany.freshdesk.com)

Confluence:

- ATLASSIAN_API_KEY
- ATLASSIAN_EMAIL
- ATLASSIAN_SITE (e.g. https://yourcompany.atlassian.net)

Optional:

- EXPORT_OUTPUT_DIR (default: ./exports/)
- EXPORT_DOWNLOAD_ASSETS (default: false)

See .env.example for full details.

---

## Output Structure

Exports are written locally and ignored by git by default.

exports/

- freshdesk-kb/
  - kb/
    - category/
      - folder/
        - article.md
- confluence-kb/
  - kb/
    - space/
      - page.md
- report.json
- SUMMARY.md

Each run produces:

- report.json – machine-readable export details
- SUMMARY.md – human-readable overview

---

## Development

- Run tests: `npm test`
- Build: `npm run build`
- Start production server: `npm start`
- Lint: `npm run lint`

Tests focus on deterministic behavior and Markdown transformation utilities.

---

## Built With

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Turndown (HTML to Markdown)
- Vitest
- Headless UI

---

## Project Status

Phase 1 complete.

Knowledge extraction, review, and quality control are fully implemented. Future phases may include saved export profiles and additional providers.

---

## License

Copyright © 2026. All rights reserved.
