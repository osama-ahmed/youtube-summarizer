import {
  getSummaryCount, setSummaryCount, setProvider, setModel, setApiKey, setOnboardingComplete,
  isOnboardingComplete, getProvider, getModel, getApiKey,
  incrementSummaryCount, addHistory,
} from './lib/storage';
import { PROVIDER_DEFAULTS } from './config';
import { sendEvent } from './lib/analytics';
import { summarizeTranscript } from './lib/llm';

function mapErrorCode(err: any): string {
  if (err.name === 'RateLimitError') return 'rate_limited';
  if (err.name === 'ApiKeyError') return 'api_key_invalid';
  if (err.name === 'NetworkError') return 'network_error';
  if (err.name === 'TranscriptNotFoundError') return 'transcript_failed';
  if (err.name === 'SummarizerError' || err instanceof Error) return 'provider_error';
  return 'unknown';
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await (self as any).skipWaiting();

  if (details.reason === 'install') {
    const defaults = PROVIDER_DEFAULTS;
    const [onboardingComplete, summaryCount, provider, model, apiKey] = await Promise.all([
      isOnboardingComplete(),
      getSummaryCount(),
      getProvider(),
      getModel(),
      getApiKey(),
    ]);
    await Promise.all([
      !onboardingComplete && setOnboardingComplete(false),
      !summaryCount && setSummaryCount(0),
      !provider && setProvider('gemini'),
      !model && setModel(defaults.gemini.model),
      !apiKey && setApiKey(''),
    ]);
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
    sendEvent('app_lifecycle', {
      event: 'install',
      version: chrome.runtime.getManifest().version,
    });
  }

  if (details.reason === 'update') {
    sendEvent('app_lifecycle', {
      event: 'update',
      version: chrome.runtime.getManifest().version,
      from_version: details.previousVersion || '',
    });
  }

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'SW_ACTIVATED' }).catch(() => console.error('sw: failed to notify tab', tab.id));
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await (self as any).skipWaiting();
});

chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
  if (msg.type === 'GENERATE_SUMMARY') {
    const { transcript, provider, apiKey, model, videoId, videoTitle } = msg;

    (async () => {
      const startTime = Date.now();
      try {
        const summary = await summarizeTranscript(transcript, provider, apiKey, model);
        const count = await incrementSummaryCount();

        await addHistory({
          id: crypto.randomUUID(),
          videoId,
          videoTitle: videoTitle || 'Summary',
          summary,
          provider,
          timestamp: Date.now(),
          transcript,
        });

        sendEvent('summarize', {
          provider,
          model,
          duration_ms: String(Date.now() - startTime),
          success: 'true',
          summary_length: String(summary.length),
        });

        sendResponse({ summary, count });
      } catch (err: any) {
        console.error('GENERATE_SUMMARY failed:', err);
        sendEvent('summarize', {
          provider,
          model,
          duration_ms: String(Date.now() - startTime),
          success: 'false',
          summary_length: '0',
          error_code: mapErrorCode(err),
        });

        sendResponse({ error: err.userMessage || 'Something went wrong. Try again.' });
      }
    })();

    return true;
  }
});
