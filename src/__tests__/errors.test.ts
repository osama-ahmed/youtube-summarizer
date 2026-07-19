import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  SummarizerError,
  InvalidUrlError,
  NetworkError,
  ApiKeyError,
  TranscriptNotFoundError,
  RateLimitError,
  apiFetch,
} from '../lib/errors';

describe('errors', () => {
  it('SummarizerError has name, userMessage, recoveryAction', () => {
    const err = new SummarizerError('oops', 'Something went wrong', 'retry');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SummarizerError');
    expect(err.message).toBe('oops');
    expect(err.userMessage).toBe('Something went wrong');
    expect(err.recoveryAction).toBe('retry');
  });

  it('InvalidUrlError defaults', () => {
    const err = new InvalidUrlError();
    expect(err.name).toBe('InvalidUrlError');
    expect(err.recoveryAction).toBe('none');
  });

  it('NetworkError has retry action', () => {
    const err = new NetworkError();
    expect(err.name).toBe('NetworkError');
    expect(err.recoveryAction).toBe('retry');
  });

  it('ApiKeyError stores provider', () => {
    const err = new ApiKeyError('openai');
    expect(err.name).toBe('ApiKeyError');
    expect(err.provider).toBe('openai');
    expect(err.recoveryAction).toBe('openSettings');
    expect(err.userMessage).toContain('openai');
  });

  it('TranscriptNotFoundError', () => {
    const err = new TranscriptNotFoundError();
    expect(err.name).toBe('TranscriptNotFoundError');
    expect(err.recoveryAction).toBe('none');
  });

  it('RateLimitError has retry action', () => {
    const err = new RateLimitError();
    expect(err.name).toBe('RateLimitError');
    expect(err.recoveryAction).toBe('retry');
  });
});

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    globalThis.fetch = vi.fn();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns response on success', async () => {
    const resp = new Response('ok', { status: 200 });
    vi.mocked(fetch).mockResolvedValue(resp);
    const result = await apiFetch('https://example.com', {}, 'test');
    expect(result.status).toBe(200);
  });

  it('throws ApiKeyError on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 401 }));
    await expect(apiFetch('https://example.com', {}, 'test')).rejects.toThrow(ApiKeyError);
  });

  it('throws ApiKeyError on 403', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 403 }));
    await expect(apiFetch('https://example.com', {}, 'test')).rejects.toThrow(ApiKeyError);
  });

  it('throws RateLimitError on 429', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 429 }));
    await expect(apiFetch('https://example.com', {}, 'test')).rejects.toThrow(RateLimitError);
  });

  it('throws SummarizerError on other status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }));
    await expect(apiFetch('https://example.com', {}, 'test')).rejects.toThrow(SummarizerError);
  });

  it('throws NetworkError on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network request failed'));
    await expect(apiFetch('https://example.com', {}, 'test')).rejects.toThrow(NetworkError);
  });
});
