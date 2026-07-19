import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendEvent, sendSummaryEvent } from '../lib/analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.storage.sync.get as any).mockResolvedValue({ gaEnabled: true });
    (chrome.storage.local.get as any).mockResolvedValue({});
    (chrome.storage.local.set as any).mockResolvedValue(undefined);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('sendEvent calls GA4 endpoint when enabled', async () => {
    await sendEvent('test_event', { foo: 'bar' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('google-analytics.com'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test_event'),
      }),
    );
  });

  it('sendEvent does not call fetch when ga is disabled', async () => {
    (chrome.storage.sync.get as any).mockResolvedValue({ gaEnabled: false });
    await sendEvent('test_event');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sendSummaryEvent sends summarize event', async () => {
    await sendSummaryEvent(1000, 'gemini', true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('google-analytics.com'),
      expect.objectContaining({
        body: expect.stringContaining('summarize'),
      }),
    );
  });

  it('does not throw on fetch failure', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('network error'));
    await expect(sendEvent('test')).resolves.toBeUndefined();
  });
});
