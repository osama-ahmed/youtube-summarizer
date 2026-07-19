import {
  getSummaryCount, setSummaryCount, setProvider, setModel, setApiKey, setOnboardingComplete,
  isOnboardingComplete, getProvider, getModel, getApiKey,
  incrementSummaryCount, addHistory,
} from './lib/storage';
import { PROVIDER_DEFAULTS } from './config';
import { sendEvent } from './lib/analytics';
import { summarizeTranscript } from './lib/llm';

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
  }

  if (details.reason === 'update') {
    sendEvent('update', { fromVersion: details.previousVersion || '' });
  }

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'SW_ACTIVATED' }).catch(() => {});
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await (self as any).skipWaiting();
});

chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
  if (msg.type === 'CHECK_SUMMARY_LIMIT') {
    getSummaryCount().then((summaryCount) => {
      sendResponse({ count: summaryCount });
    });
    return true;
  }

  if (msg.type === 'GENERATE_SUMMARY') {
    const { transcript, provider, apiKey, model, videoId, videoTitle } = msg;

    (async () => {
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

        sendResponse({ summary, count });
      } catch (err: any) {
        sendResponse({ error: err.userMessage || 'Something went wrong. Try again.' });
      }
    })();

    return true;
  }
});
