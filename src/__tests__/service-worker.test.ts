import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PROVIDER_DEFAULTS } from '../config';

vi.mock('../lib/llm', () => ({
  summarizeTranscript: vi.fn().mockResolvedValue('mock summary'),
}));

vi.mock('../lib/analytics', () => ({
  sendEvent: vi.fn(),
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

    it('sends app_lifecycle event on install', async () => {
      const { sendEvent } = await import('../lib/analytics');
      vi.mocked(sendEvent).mockClear();
      await import('../service-worker');
      const handler = (chrome.runtime.onInstalled.addListener as any).mock.calls[0][0];
      await handler({ reason: 'install' });

      expect(sendEvent).toHaveBeenCalledWith('app_lifecycle', expect.objectContaining({
        event: 'install',
        version: '1.0.0',
      }));
    });

    it('sends app_lifecycle event on update', async () => {
      const { sendEvent } = await import('../lib/analytics');
      vi.mocked(sendEvent).mockClear();
      await import('../service-worker');
      const handler = (chrome.runtime.onInstalled.addListener as any).mock.calls[0][0];
      await handler({ reason: 'update', previousVersion: '1.0.0' });

      expect(sendEvent).toHaveBeenCalledWith('app_lifecycle', expect.objectContaining({
        event: 'update',
        version: '1.0.0',
        from_version: '1.0.0',
      }));
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

    it('sends summarize event on success', async () => {
      const { sendEvent } = await import('../lib/analytics');
      vi.mocked(sendEvent).mockClear();
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
      expect(sendEvent).toHaveBeenCalledWith('summarize', expect.objectContaining({
        provider: 'gemini',
        model: 'gemini-pro',
        success: 'true',
      }));
    });

    it('sends summarize event on failure', async () => {
      const { sendEvent } = await import('../lib/analytics');
      vi.mocked(sendEvent).mockClear();

      const { summarizeTranscript } = await import('../lib/llm');
      vi.mocked(summarizeTranscript).mockRejectedValueOnce(
        Object.assign(new Error('Rate limited'), { name: 'RateLimitError', userMessage: 'Wait' })
      );

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
      expect(sendEvent).toHaveBeenCalledWith('summarize', expect.objectContaining({
        provider: 'gemini',
        model: 'gemini-pro',
        success: 'false',
        error_code: 'rate_limited',
      }));
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
