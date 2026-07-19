export type LLMProviderId = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'xai';

export interface LLMConfig {
  apiKey: string;
  provider: LLMProviderId;
  model: string;
}


