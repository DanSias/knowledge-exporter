# Knowledge Exporter

Export support knowledge bases like Freshdesk Solutions to deterministic Markdown files.

## What It Does

Knowledge Exporter connects to support platforms (currently Freshdesk Solutions) and exports articles to clean, deterministic Markdown files. Perfect for:
- Feeding into documentation systems
- Training AI models
- Version controlling your knowledge base
- Migrating between platforms

**What it does NOT do**: Ingestion, search, or indexing. Those are handled by downstream tools like Verbatim.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start development server
npm run dev

# 4. Visit http://localhost:3000
# Click "Start an Export" to begin
```

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

## Features

- ✅ **Deterministic output**: Consistent file paths (`kb/<category>/<folder>/<slug>.md`)
- ✅ **Idempotent writes**: Skip unchanged files, update modified content
- ✅ **Clean Markdown**: HTML converted with preserved structure
- ✅ **Published content only**: Filters for published English articles
- ✅ **File splitting**: Optional splitting for large articles
- ✅ **Comprehensive reports**: JSON and Markdown summaries

## Supported Providers

- ✅ **Freshdesk Solutions** (v2 API)
- 🔄 Zendesk, Intercom, and others planned

## Documentation

- [Quick Start Guide](./QUICK_START.md) - 30-second setup
- [Export Implementation](./EXPORT_IMPLEMENTATION.md) - Complete technical documentation
- [Manual Test Guide](./MANUAL_TEST_GUIDE.md) - Comprehensive testing procedures
- [Phase 1 Summary](./PHASE1_SUMMARY.md) - Implementation overview

## Project Structure

```
knowledge-exporter/
├── app/
│   ├── api/export/freshdesk/      # API routes
│   ├── components/                # Shared UI components
│   └── pilot/export/              # Export wizard UI
├── lib/
│   └── exporters/
│       ├── freshdesk/             # Freshdesk implementation
│       └── utils/                 # Shared utilities
└── exports/                       # Default output directory
```

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

Required:
- `FRESHDESK_API_KEY` - Your Freshdesk API key
- `FRESHDESK_HOST` - Your Freshdesk domain (e.g., `yourcompany.freshdesk.com`)

Optional:
- `EXPORT_OUTPUT_DIR` - Default: `./exports/freshdesk-kb`
- `EXPORT_DOWNLOAD_ASSETS` - Default: `false`

See [.env.example](./.env.example) for details.

## Built With

- [Next.js 16](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [Vitest](https://vitest.dev/) - Testing

## License

Copyright © 2026. All rights reserved.

## Contributing

This is a private project. For issues or questions, please contact the development team.
