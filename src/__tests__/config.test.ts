import { describe, it, expect } from 'vitest';
import { MAX_HISTORY_ENTRIES, MAX_TRANSCRIPT_CHARS, ANTHROPIC_MAX_TOKENS, GA_MEASUREMENT_ID, GA_API_SECRET } from '../config';

describe('config', () => {
  it('MAX_HISTORY_ENTRIES is 100', () => {
    expect(MAX_HISTORY_ENTRIES).toBe(100);
  });

  it('MAX_TRANSCRIPT_CHARS is 80000', () => {
    expect(MAX_TRANSCRIPT_CHARS).toBe(80000);
  });

  it('ANTHROPIC_MAX_TOKENS is 4096', () => {
    expect(ANTHROPIC_MAX_TOKENS).toBe(4096);
  });

  it('GA_MEASUREMENT_ID is set', () => {
    expect(GA_MEASUREMENT_ID).toMatch(/^G-/);
  });

  it('GA_API_SECRET is set', () => {
    expect(GA_API_SECRET).toBeTruthy();
  });
});
