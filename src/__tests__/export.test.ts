// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportHistoryToZip } from '../lib/export';
import { getHistory } from '../lib/storage';

vi.mock('../lib/storage', () => ({
  getHistory: vi.fn(),
}));

(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
};

describe('exportHistoryToZip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when history is empty', async () => {
    vi.mocked(getHistory).mockResolvedValue([]);
    const result = await exportHistoryToZip();
    expect(result).toBeUndefined();
  });

  it('generates a zip with correct structure', async () => {
    vi.mocked(getHistory).mockResolvedValue([
      {
        id: '1',
        videoId: 'abc123',
        videoTitle: 'Test Video',
        summary: '# Summary\n\nGreat content.',
        provider: 'gemini',
        timestamp: 1700000000000,
        transcript: 'Hello world transcript.',
      },
    ]);

    const click = vi.fn();
    const remove = vi.fn();
    const mockA = {
      click,
      remove,
      href: '',
      download: '',
      setAttribute: vi.fn(),
      style: {},
    } as any;
    document.createElement = vi.fn((tag) => tag === 'a' ? mockA : document.createElement(tag));
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    await expect(exportHistoryToZip()).resolves.not.toThrow();
  });
});
