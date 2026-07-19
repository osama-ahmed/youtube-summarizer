import { LLMProviderId } from './types';
import { MAX_HISTORY_ENTRIES } from '../config';

const HISTORY_KEY = 'summary_history';
const GA_CLIENT_ID_KEY = 'ga_client_id';
const PENDING_VIDEO_KEY = 'pendingSummarizeVideoId';

export interface ExtensionConfig {
  provider: LLMProviderId;
  apiKey: string;
  model: string;
  summaryCount: number;
  onboardingComplete: boolean;
  gaEnabled: boolean;
  theme: 'light' | 'dark';
}

const DEFAULTS: ExtensionConfig = {
  provider: 'gemini',
  apiKey: '',
  model: '',
  summaryCount: 0,
  onboardingComplete: false,
  gaEnabled: true,
  theme: 'light',
};

export interface HistoryEntry {
  id: string;
  videoId: string;
  videoTitle: string;
  summary: string;
  provider: LLMProviderId;
  timestamp: number;
  transcript?: string;
}

async function getConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.sync.get(null);
  return { ...DEFAULTS, ...result } as ExtensionConfig;
}

async function setConfig(partial: Partial<ExtensionConfig>): Promise<void> {
  await chrome.storage.sync.set(partial);
}

export async function getProvider(): Promise<LLMProviderId> {
  const { provider } = await getConfig();
  return provider;
}

export async function getApiKey(): Promise<string> {
  const { apiKey } = await getConfig();
  return apiKey;
}

export async function getModel(): Promise<string> {
  const { model } = await getConfig();
  return model;
}

export async function getSummaryCount(): Promise<number> {
  const { summaryCount } = await getConfig();
  return summaryCount;
}

export async function getGaEnabled(): Promise<boolean> {
  const { gaEnabled } = await getConfig();
  return gaEnabled;
}

export async function getTheme(): Promise<'light' | 'dark'> {
  const { theme } = await getConfig();
  return theme;
}

export async function setProvider(id: LLMProviderId): Promise<void> {
  await setConfig({ provider: id });
}

export async function setApiKey(key: string): Promise<void> {
  await setConfig({ apiKey: key });
}

export async function setModel(model: string): Promise<void> {
  await setConfig({ model });
}

export async function setSummaryCount(count: number): Promise<void> {
  await setConfig({ summaryCount: count });
}

export async function setGaEnabled(enabled: boolean): Promise<void> {
  await setConfig({ gaEnabled: enabled });
}

export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
  await setConfig({ theme });
}

let incrementPromise: Promise<number> | null = null;

export async function incrementSummaryCount(): Promise<number> {
  if (incrementPromise) {
    await incrementPromise;
  }
  incrementPromise = (async () => {
    const config = await getConfig();
    const count = config.summaryCount + 1;
    await setConfig({ summaryCount: count });
    return count;
  })();
  return incrementPromise;
}

export async function setOnboardingComplete(complete: boolean = true): Promise<void> {
  await setConfig({ onboardingComplete: complete });
}

export async function isOnboardingComplete(): Promise<boolean> {
  const { onboardingComplete } = await getConfig();
  return !!onboardingComplete;
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const existing = await getHistory();
  existing.unshift(entry);
  const trimmed = existing.slice(0, MAX_HISTORY_ENTRIES);
  await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return (result[HISTORY_KEY] || []) as HistoryEntry[];
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter(h => h.id !== id);
  await chrome.storage.local.set({ [HISTORY_KEY]: filtered });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}

export async function getGaClientId(): Promise<string | undefined> {
  const result = await chrome.storage.local.get(GA_CLIENT_ID_KEY);
  return result[GA_CLIENT_ID_KEY] as string | undefined;
}

export async function setGaClientId(id: string): Promise<void> {
  await chrome.storage.local.set({ [GA_CLIENT_ID_KEY]: id });
}

export async function getPendingVideoId(): Promise<string | undefined> {
  const result = await chrome.storage.local.get(PENDING_VIDEO_KEY);
  return result[PENDING_VIDEO_KEY] as string | undefined;
}

export async function setPendingVideoId(id: string): Promise<void> {
  await chrome.storage.local.set({ [PENDING_VIDEO_KEY]: id });
}

export async function removePendingVideoId(): Promise<void> {
  await chrome.storage.local.remove(PENDING_VIDEO_KEY);
}
