import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getProvider, getApiKey, getModel, getSummaryCount, getGaEnabled, getTheme, setApiKey, setSummaryCount, incrementSummaryCount,   setOnboardingComplete, isOnboardingComplete, addHistory, getHistory, clearHistory } from '../lib/storage';

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockStorage: Record<string, any> = {};
    (chrome.storage.sync.get as any).mockImplementation((keys?: any) => {
      if (!keys) return Promise.resolve({ ...mockStorage });
      if (typeof keys === 'string') return Promise.resolve({ [keys]: mockStorage[keys] });
      if (Array.isArray(keys)) {
        const result: Record<string, any> = {};
        keys.forEach(k => { if (k in mockStorage) result[k] = mockStorage[k]; });
        return Promise.resolve(result);
      }
      return Promise.resolve({ ...mockStorage });
    });
    (chrome.storage.sync.set as any).mockImplementation((items: any) => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });
  });

  it('returns defaults when storage is empty', async () => {
    expect(await getProvider()).toBe('gemini');
    expect(await getApiKey()).toBe('');
    expect(await getSummaryCount()).toBe(0);
    expect(await getGaEnabled()).toBe(true);
    expect(await getTheme()).toBe('light');
  });

  it('setters store values', async () => {
    await setApiKey('test-key');
    expect(await getApiKey()).toBe('test-key');
  });

  it('multiple setters', async () => {
    await setApiKey('test-key');
    await setSummaryCount(5);
    expect(await getApiKey()).toBe('test-key');
    expect(await getSummaryCount()).toBe(5);
    expect(await getGaEnabled()).toBe(true);
  });

  it('incrementSummaryCount increments', async () => {
    const count1 = await incrementSummaryCount();
    expect(count1).toBe(1);
    const count2 = await incrementSummaryCount();
    expect(count2).toBe(2);
  });

  it('setOnboardingComplete / isOnboardingComplete', async () => {
    expect(await isOnboardingComplete()).toBe(false);
    await setOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
  });

  describe('history', () => {
    beforeEach(() => {
      const mockLocal: Record<string, any> = {};
      (chrome.storage.local.get as any).mockImplementation((keys: any) => {
        if (typeof keys === 'string') return Promise.resolve({ [keys]: mockLocal[keys] });
        return Promise.resolve({ ...mockLocal });
      });
      (chrome.storage.local.set as any).mockImplementation((items: any) => {
        Object.assign(mockLocal, items);
        return Promise.resolve();
      });
      (chrome.storage.local.remove as any).mockImplementation((key: string) => {
        delete mockLocal[key];
        return Promise.resolve();
      });
    });

    it('add and get history', async () => {
      await addHistory({ id: '1', videoId: 'abc', videoTitle: 'Test', summary: '...', provider: 'gemini', timestamp: 1 });
      const history = await getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].videoTitle).toBe('Test');
    });

    it('clear history', async () => {
      await addHistory({ id: '1', videoId: 'abc', videoTitle: 'Test', summary: '...', provider: 'gemini', timestamp: 1 });
      await clearHistory();
      expect(await getHistory()).toHaveLength(0);
    });

    it('returns empty array when no history', async () => {
      expect(await getHistory()).toEqual([]);
    });
  });
});
