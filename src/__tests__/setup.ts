import { vi } from 'vitest';

const mockStorage: Record<string, any> = {};
const mockLocalStorage: Record<string, any> = {};

vi.stubGlobal('chrome', {
  storage: {
    sync: {
      get: vi.fn((keys?: string | string[] | null) => {
        if (!keys) return Promise.resolve({ ...mockStorage });
        if (typeof keys === 'string') return Promise.resolve({ [keys]: mockStorage[keys] });
        if (Array.isArray(keys)) {
          const result: Record<string, any> = {};
          keys.forEach(k => { if (k in mockStorage) result[k] = mockStorage[k]; });
          return Promise.resolve(result);
        }
        return Promise.resolve({ ...mockStorage });
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
        return Promise.resolve();
      }),
    },
    local: {
      get: vi.fn((keys?: string | string[] | null) => {
        if (!keys) return Promise.resolve({ ...mockLocalStorage });
        if (typeof keys === 'string') return Promise.resolve({ [keys]: mockLocalStorage[keys] });
        if (Array.isArray(keys)) {
          const result: Record<string, any> = {};
          keys.forEach(k => { if (k in mockLocalStorage) result[k] = mockLocalStorage[k]; });
          return Promise.resolve(result);
        }
        return Promise.resolve({ ...mockLocalStorage });
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockLocalStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        delete mockLocalStorage[key];
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]);
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    id: 'test-extension-id',
    openOptionsPage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://id/${path}`),
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    sendMessage: vi.fn(),
  },
  windows: {
    create: vi.fn(),
  },
});

vi.stubGlobal('self', { skipWaiting: vi.fn() });
