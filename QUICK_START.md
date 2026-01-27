# Quick Start Guide

## Setup (30 seconds)

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Edit .env.local with your credentials
FRESHDESK_API_KEY=your_api_key_here
FRESHDESK_HOST=rocketgate.freshdesk.com

# 3. Install dependencies (if not already done)
npm install

# 4. Start dev server
npm run dev
```

## Visit the App

```
http://localhost:3000/pilot/export
```

## Run Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm test:ui
```

## Build for Production

```bash
npm run build
npm start
```

## What You'll See

### Step 1: Configure
- ✅ Green checkmarks for configured env vars
- 🔗 Resolved Freshdesk base URL
- 📝 Missing config warnings (if applicable)
- 🔵 "Continue" button when ready

### Step 2: Select Scope
- 🔄 Loading categories from Freshdesk
- 📊 Category list with article counts
- ☑️ "Export all categories" toggle (default: ON)
- ✅ Select individual categories (when toggle OFF)
- 📈 Real-time article count summary

### Steps 3-5
Coming in future iterations.

## Troubleshooting

**Can't connect to Freshdesk?**
- Check your API key is correct
- Verify your host is `rocketgate.freshdesk.com` (not `help.rocketgate.com`)
- Ensure API key has Solutions access

**No categories showing?**
- Check browser console for errors
- Try the "Retry" button
- Verify your account has Solutions articles

**Environment variables not working?**
- Restart the dev server after changing `.env.local`
- Check file is named `.env.local` (not `.env`)
- Ensure no typos in variable names

## Getting Help

- 📖 See `FRESHDESK_PREVIEW.md` for detailed documentation
- 📋 See `IMPLEMENTATION_SUMMARY.md` for implementation details
- 🐛 Check browser console for client-side errors
- 📊 Check terminal for server-side errors
