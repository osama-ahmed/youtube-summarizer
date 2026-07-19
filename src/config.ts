export const MAX_HISTORY_ENTRIES = 100;
export const MAX_TRANSCRIPT_CHARS = 80000;
export const ANTHROPIC_MAX_TOKENS = 4096;

export { GA_MEASUREMENT_ID, GA_API_SECRET } from './ga-secrets';

import type { LLMProviderId } from './lib/types';

export const PROVIDER_DEFAULTS: Record<LLMProviderId, { model: string; label: string }> = {
  gemini: { model: 'gemini-3.1-flash-lite', label: 'Gemini' },
  openai: { model: 'gpt-5.6-luna', label: 'OpenAI' },
  anthropic: { model: 'claude-sonnet-5', label: 'Anthropic' },
  deepseek: { model: 'deepseek-v4-flash', label: 'DeepSeek' },
  xai: { model: 'grok-4.5', label: 'xAI (Grok)' },
};

export const AVAILABLE_MODELS: Record<LLMProviderId, string[]> = {
  gemini: [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
  ],
  openai: [
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-5.6-luna',
    'gpt-5.5',
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
  ],
  anthropic: [
    'claude-fable-5',
    'claude-opus-4-8',
    'claude-sonnet-5',
    'claude-haiku-4-5',
  ],
  deepseek: [
    'deepseek-v4-flash',
    'deepseek-v4-pro',
  ],
  xai: [
    'grok-4.5',
  ],
};

export const MODEL_LABELS: Record<string, string> = {
  'gemini-3.5-flash': 'Gemini 3.5 Flash',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gpt-5.6-sol': 'GPT-5.6 Sol',
  'gpt-5.6-terra': 'GPT-5.6 Terra',
  'gpt-5.6-luna': 'GPT-5.6 Luna',
  'gpt-5.5': 'GPT-5.5',
  'gpt-5.4': 'GPT-5.4',
  'gpt-5.4-mini': 'GPT-5.4 Mini',
  'gpt-5.4-nano': 'GPT-5.4 Nano',
  'claude-fable-5': 'Claude Fable 5',
  'claude-opus-4-8': 'Claude Opus 4.8',
  'claude-sonnet-5': 'Claude Sonnet 5',
  'claude-haiku-4-5': 'Claude Haiku 4.5',
  'deepseek-v4-flash': 'DeepSeek V4 Flash',
  'deepseek-v4-pro': 'DeepSeek V4 Pro',
  'grok-4.5': 'Grok 4.5',
};
