import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('content-script', () => {
  let moCallback: () => void;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    (chrome.tabs.query as any).mockResolvedValue([]);
    (chrome.runtime.sendMessage as any).mockReturnValue(Promise.resolve());
    (globalThis as any).location = { href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    (globalThis as any).document = { body: {} };
    moCallback = vi.fn();
    (globalThis as any).MutationObserver = class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(cb: () => void) { moCallback = cb; }
    };
  });

  afterEach(() => {
    delete (globalThis as any).location;
    delete (globalThis as any).document;
    delete (globalThis as any).MutationObserver;
  });

  it('registers FETCH_TRANSCRIPT handler', async () => {
    await import('../content-script');
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('notifies popup on initial load', async () => {
    await import('../content-script');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'URL_CHANGED', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    );
  });

  it('sends URL_CHANGED on navigation', async () => {
    await import('../content-script');
    const initialCalls = (chrome.runtime.sendMessage as any).mock.calls.length;
    (globalThis as any).location.href = 'https://www.youtube.com/watch?v=newVideo123';
    moCallback();
    await new Promise(r => setTimeout(r, 150));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(initialCalls + 1);
    expect(chrome.runtime.sendMessage).toHaveBeenLastCalledWith(
      { type: 'URL_CHANGED', url: 'https://www.youtube.com/watch?v=newVideo123' }
    );
  });
});
