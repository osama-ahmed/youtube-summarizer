# YouTube Summarizer Extension

Chrome extension (MV3) for AI-powered YouTube video summaries. TypeScript + esbuild, no framework. unlimited summaries.

## Commands

| Action | Command |
|--------|---------|
| Build | `npm run build` |
| Watch | `npm run watch` |
| Package | `npm run package` |
| Test (unit) | `npm test` (Vitest, 87 tests) |
| Test (E2E) | `npm run test:e2e` (Puppeteer, 6 tests, auto-builds) |
| Typecheck | `npx tsc --noEmit` |

## Architecture

```
src/
├── lib/           Shared logic
│   ├── storage.ts      chrome.storage.sync wrapper (config + history)
│   ├── errors.ts       SummarizerError hierarchy
│   ├── types.ts        LLMProviderId type
│   ├── prompt.ts       Prompt builder (7 sections)
│   ├── transcript.ts   Fetches from youtubetranscript.com
│   ├── video-id.ts     URL → video ID extraction
│   ├── llm.ts          Routes to provider by ID
│   ├── analytics.ts    GA4 event sender (Measurement Protocol)
│   └── providers/      One file per LLM (raw fetch, no SDKs)
│       ├── gemini.ts
│       ├── openai.ts
│       ├── anthropic.ts
│       ├── deepseek.ts
│       └── xai.ts
├── popup/          Popup UI (380×540px, 6 views)
├── options/        Settings page
├── onboarding/     First-run wizard (3 steps)
├── __tests__/      Unit tests (Vitest, mocks chrome.* globals)
│   ├── setup.ts
│   └── e2e/        E2E tests (Puppeteer + headless Chrome)
├── config.ts       All constants (GA IDs, models)
├── content-script.ts   MutationObserver for YouTube SPA
└── service-worker.ts   Background (messaging)
static/             HTML files (popup, options, onboarding, privacy)
dist/               Build output (gitignored)
icons/              Icon PNGs (auto-generated via sharp on build)
```

## Key Decisions

- **BYOK** — user provides their own API key, no server-side proxy
- **Raw fetch** — no SDK dependencies, keeps bundle under 50KB
- **5 providers** — Gemini, OpenAI, Anthropic, DeepSeek, xAI (Grok)
- **TypeScript + esbuild** — fast builds, no bundler config complexity
- **Light/dark theme** — CSS variables + `data-theme` attr on `<html>`, persisted in storage
- **Icons auto-generated** — `build.mjs` uses sharp to render play-triangle + sparkle SVGs to PNG

## Tests

```
npm test         # 87 unit tests (Vitest, Node environment)
npm run test:e2e # 6 E2E tests (Vitest + Puppeteer, headless Chrome, auto-builds)
```

Unit tests mock `chrome.*` APIs. E2E tests load the built extension in a real browser and test popup DOM interactions.

## Provider Notes

All providers use raw `fetch()` to avoid SDK bundle bloat. Anthropic uses `max_tokens: 4096` (from config). Each has a `validateApiKey` that hits the provider's list-models endpoint.

## Build

`npm run build` bundles each entry point separately, generates icons via sharp, and copies static HTML files. Service worker output has all imports inlined (no `import` statements needed for MV3). GA4 secrets auto-created from example if missing.

