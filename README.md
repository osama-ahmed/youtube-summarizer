# YouTube Summarizer — Chrome Extension

AI-generated YouTube video summaries with **key points, learnings, notable quotes, chapter breakdown, Q&A, and evaluation**. Choose your AI provider — Gemini, OpenAI, Anthropic, DeepSeek, or xAI (Grok) — and bring your own API key.

## Features

- **7-section summary** — TL;DR, Key Points, Learnings, Quotes, Chapters, Q&A, Evaluation
- **5 LLM providers** — Gemini, OpenAI, Anthropic, DeepSeek, xAI (Grok)
- **BYOK** — your API key, your data, your privacy. No server-side proxy
- **Keyboard shortcut** — `Ctrl+Shift+Y` / `Cmd+Shift+Y` to open
- **SPA-aware** — works with YouTube's single-page navigation
- **History** — last 100 summaries saved locally (tap to re-view, delete individually)
- **Light/dark theme** — toggle in popup or Settings, persisted
- **Smart dedup** — re-opening popup on same video shows cached summary (no re-generation)

## Quick Start

```bash
npm install
npm run build
```

1. Open `chrome://extensions`
2. Enable Developer Mode
3. **Load unpacked** → select `dist/`
4. Click the extension icon → **Set Up API Key**
5. Choose a provider, get your key, paste it in

## Test

```bash
npm test            # 87 unit tests (Vitest)
npm run test:e2e    # 6 E2E tests (Puppeteer, headless Chrome, auto-builds)
npx tsc --noEmit    # Typecheck
```

## Build & Ship

```bash
npm run build        # TypeScript → dist/ (auto-generates icons)
npm run watch        # Rebuild on changes
npm run package      # zip dist/ → youtube-summarizer.zip
```

## Privacy

- **No tracking** of video URLs, transcripts, or API keys
- **Anonymous GA4** events for usage analytics (opt-out in Settings)
- Your browser talks directly to your chosen LLM provider
