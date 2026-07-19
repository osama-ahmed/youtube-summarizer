import { buildSummaryPrompt } from '../prompt';
import { apiFetch } from '../errors';

export async function summarize(transcript: string, apiKey: string, model: string): Promise<string> {
  const prompt = buildSummaryPrompt(transcript);
  const resp = await apiFetch(
    'https://api.x.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    'xai',
  );
  const data = await resp.json() as any;
  return data?.choices?.[0]?.message?.content || '';
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const resp = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return resp.ok;
  } catch { return false; }
}
