import { getGaEnabled, getGaClientId, setGaClientId } from './storage';
import { GA_MEASUREMENT_ID, GA_API_SECRET } from '../config';

function generateClientId(): string {
  return crypto.randomUUID();
}

async function getClientId(): Promise<string> {
  const existing = await getGaClientId();
  if (existing) return existing;
  const id = generateClientId();
  await setGaClientId(id);
  return id;
}

export async function sendEvent(name: string, params: Record<string, string> = {}): Promise<void> {
  try {
    if (!(await getGaEnabled())) return;
    const clientId = await getClientId();
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          events: [{ name, params: { ...params, engagement_time_msec: '1' } }],
        }),
      },
    );
  } catch (e) { console.error('analytics:', e); }
}

