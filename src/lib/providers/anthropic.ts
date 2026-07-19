import { buildSummaryPrompt } from '../prompt';
import { apiFetch } from '../errors';
import { ANTHROPIC_MAX_TOKENS } from '../../config';

export async function summarize(transcript: string, apiKey: string, model: string): Promise<string> {
  const prompt = buildSummaryPrompt(transcript);
  const resp = await apiFetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    'anthropic',
  );
  const data = await resp.json() as any;
  return data?.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') || '';
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
    });
    return resp.ok;
  } catch { return false; }
}
