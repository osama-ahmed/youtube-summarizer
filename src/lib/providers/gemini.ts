import { buildSummaryPrompt } from '../prompt';
import { apiFetch } from '../errors';

export async function summarize(transcript: string, apiKey: string, model: string): Promise<string> {
  const prompt = buildSummaryPrompt(transcript);
  const resp = await apiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
    'gemini',
  );
  const data = await resp.json() as any;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
    });
    return resp.ok;
  } catch { return false; }
}
