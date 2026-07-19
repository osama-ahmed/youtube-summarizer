import { describe, it, expect } from 'vitest';
import { PROVIDER_DEFAULTS } from '../config';

describe('types', () => {
  it('has defaults for all 5 providers', () => {
    expect(Object.keys(PROVIDER_DEFAULTS)).toEqual(['gemini', 'openai', 'anthropic', 'deepseek', 'xai']);
  });

  it('each provider has model and label', () => {
    for (const [id, config] of Object.entries(PROVIDER_DEFAULTS)) {
      expect(config.model).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });
});
