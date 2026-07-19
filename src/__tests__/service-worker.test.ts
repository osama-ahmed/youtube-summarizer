import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSummaryCount } from '../lib/storage';
import { PROVIDER_DEFAULTS } from '../config';

vi.mock('../lib/llm', () => ({
  summarizeTranscript: vi.fn().mockResolvedValue('mock summary'),
}));

describe('service-worker', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    (chrome.tabs.query as any).mockResolvedValue([]);
  });

  describe('onInstalled', () => {
    it('sets defaults and opens onboarding on install', async () => {
      await import('../service-worker');
      const handler = (chrome.runtime.onInstalled.addListener as any).mock.calls[0][0];
      await handler({ reason: 'install' });

      expect(chrome.tabs.create).toHaveBeenCalledWith(
        { url: 'chrome-extension://id/onboarding/onboarding.html' }
      );
    });

    it('preserves existing values on reinstall', async () => {
      await chrome.storage.sync.set({ apiKey: 'existing-key', provider: 'anthropic', gaEnabled: false });

      await import('../service-worker');
      const handler = (chrome.runtime.onInstalled.addListener as any).mock.calls[0][0];
      await handler({ reason: 'install' });

      const stored = await chrome.storage.sync.get(null);
      expect(stored.apiKey).toBe('existing-key');
      expect(stored.provider).toBe('anthropic');
      expect(stored.gaEnabled).toBe(false);
    });
  });

  describe('onStartup', () => {
    it('calls skipWaiting', async () => {
      await import('../service-worker');
      const handler = (chrome.runtime.onStartup.addListener as any).mock.calls[0][0];
      await handler();
      expect((self as any).skipWaiting).toHaveBeenCalled();
    });
  });

  describe('CHECK_SUMMARY_LIMIT', () => {
    it('returns count and pro status', async () => {
      await chrome.storage.sync.set({ summaryCount: 3 });
      await import('../service-worker');
      const handler = (chrome.runtime.onMessage.addListener as any).mock.calls[0][0];

      const sendResponse = vi.fn();
      const result = handler({ type: 'CHECK_SUMMARY_LIMIT' }, {}, sendResponse);
      expect(result).toBe(true);
      await vi.waitUntil(() => sendResponse.mock.calls.length > 0);

      expect(sendResponse).toHaveBeenCalledWith({ count: 3 });
    });
  });

  describe('GENERATE_SUMMARY', () => {
    it('returns summary on success', async () => {
      await chrome.storage.sync.set({ summaryCount: 0 });
      await import('../service-worker');
      const handler = (chrome.runtime.onMessage.addListener as any).mock.calls[0][0];

      const sendResponse = vi.fn();
      handler({
        type: 'GENERATE_SUMMARY',
        transcript: 'video transcript',
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-pro',
        videoId: 'abc123',
        videoTitle: 'Test Video',
      }, {}, sendResponse);

      await vi.waitUntil(() => sendResponse.mock.calls.length > 0, { timeout: 2000 });
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'mock summary', count: 1 })
      );
    });

    it('returns summary even when count is high (no limit)', async () => {
      await chrome.storage.sync.set({ summaryCount: 999 });
      await import('../service-worker');
      const handler = (chrome.runtime.onMessage.addListener as any).mock.calls[0][0];

      const sendResponse = vi.fn();
      handler({
        type: 'GENERATE_SUMMARY',
        transcript: 'video transcript',
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-pro',
        videoId: 'abc123',
        videoTitle: 'Test Video',
      }, {}, sendResponse);

      await vi.waitUntil(() => sendResponse.mock.calls.length > 0, { timeout: 2000 });
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'mock summary' })
      );
    });
  });
});
