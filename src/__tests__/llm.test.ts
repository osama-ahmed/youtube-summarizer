import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/providers/gemini', () => ({
  summarize: vi.fn().mockResolvedValue('gemini summary'),
  validateApiKey: vi.fn().mockResolvedValue(true),
}));
vi.mock('../lib/providers/openai', () => ({
  summarize: vi.fn().mockResolvedValue('openai summary'),
  validateApiKey: vi.fn().mockResolvedValue(true),
}));
vi.mock('../lib/providers/anthropic', () => ({
  summarize: vi.fn().mockResolvedValue('anthropic summary'),
  validateApiKey: vi.fn().mockResolvedValue(true),
}));
vi.mock('../lib/providers/deepseek', () => ({
  summarize: vi.fn().mockResolvedValue('deepseek summary'),
  validateApiKey: vi.fn().mockResolvedValue(true),
}));
vi.mock('../lib/providers/xai', () => ({
  summarize: vi.fn().mockResolvedValue('xai summary'),
  validateApiKey: vi.fn().mockResolvedValue(true),
}));

import { summarizeTranscript, validateApiKey } from '../lib/llm';
import { summarize as geminiSummarize } from '../lib/providers/gemini';
import { summarize as openaiSummarize } from '../lib/providers/openai';
import { summarize as anthropicSummarize } from '../lib/providers/anthropic';
import { summarize as deepseekSummarize } from '../lib/providers/deepseek';
import { summarize as xaiSummarize } from '../lib/providers/xai';
import { validateApiKey as validateGemini } from '../lib/providers/gemini';

describe('llm', () => {
  describe('summarizeTranscript', () => {
    it('dispatches to gemini', async () => {
      const result = await summarizeTranscript('text', 'gemini', 'key', 'model');
      expect(result).toBe('gemini summary');
      expect(geminiSummarize).toHaveBeenCalledWith('text', 'key', 'model');
    });

    it('dispatches to openai', async () => {
      const result = await summarizeTranscript('text', 'openai', 'key', 'model');
      expect(result).toBe('openai summary');
      expect(openaiSummarize).toHaveBeenCalledWith('text', 'key', 'model');
    });

    it('dispatches to anthropic', async () => {
      const result = await summarizeTranscript('text', 'anthropic', 'key', 'model');
      expect(result).toBe('anthropic summary');
      expect(anthropicSummarize).toHaveBeenCalledWith('text', 'key', 'model');
    });

    it('dispatches to deepseek', async () => {
      const result = await summarizeTranscript('text', 'deepseek', 'key', 'model');
      expect(result).toBe('deepseek summary');
      expect(deepseekSummarize).toHaveBeenCalledWith('text', 'key', 'model');
    });

    it('dispatches to xai', async () => {
      const result = await summarizeTranscript('text', 'xai', 'key', 'model');
      expect(result).toBe('xai summary');
      expect(xaiSummarize).toHaveBeenCalledWith('text', 'key', 'model');
    });

    it('throws for unknown provider', async () => {
      await expect(summarizeTranscript('text', 'unknown' as any, 'key', 'model')).rejects.toThrow('Unknown provider: unknown');
    });
  });

  describe('validateApiKey', () => {
    it('dispatches to correct provider validator', async () => {
      const result = await validateApiKey('gemini', 'key');
      expect(result).toBe(true);
      expect(validateGemini).toHaveBeenCalledWith('key');
    });
  });
});
