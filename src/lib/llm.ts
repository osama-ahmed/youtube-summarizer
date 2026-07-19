import { LLMProviderId } from './types';
import { summarize as geminiSummarize, validateApiKey as validateGemini } from './providers/gemini';
import { summarize as openaiSummarize, validateApiKey as validateOpenAI } from './providers/openai';
import { summarize as anthropicSummarize, validateApiKey as validateAnthropic } from './providers/anthropic';
import { summarize as deepseekSummarize, validateApiKey as validateDeepSeek } from './providers/deepseek';
import { summarize as xaiSummarize, validateApiKey as validateXai } from './providers/xai';

export async function summarizeTranscript(
  transcript: string,
  provider: LLMProviderId,
  apiKey: string,
  model: string,
): Promise<string> {
  const adapters: Record<LLMProviderId, (t: string, k: string, m: string) => Promise<string>> = {
    gemini: geminiSummarize,
    openai: openaiSummarize,
    anthropic: anthropicSummarize,
    deepseek: deepseekSummarize,
    xai: xaiSummarize,
  };

  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Unknown provider: ${provider}`);

  return adapter(transcript, apiKey, model);
}

export async function validateApiKey(provider: LLMProviderId, key: string): Promise<boolean> {
  const validators: Record<LLMProviderId, (key: string) => Promise<boolean>> = {
    gemini: validateGemini,
    openai: validateOpenAI,
    anthropic: validateAnthropic,
    deepseek: validateDeepSeek,
    xai: validateXai,
  };
  return validators[provider](key);
}
