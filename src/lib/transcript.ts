import { NetworkError, TranscriptNotFoundError, SummarizerError } from './errors';

export interface TranscriptResult {
  text: string;
  title: string;
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (resp.ok) {
      const data = await resp.json() as { title?: string };
      return data.title || '';
    }
  } catch {}
  return '';
}

export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id) {
      throw new SummarizerError('No active tab', 'Could not access the current tab.', 'retry');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'FETCH_TRANSCRIPT', videoId });

    if (!response || response.error) {
      const msg = response?.error || '';
      if (msg.includes('disabled') || msg.includes('No transcript') || msg.includes('Not available')) {
        throw new TranscriptNotFoundError();
      }
      throw new SummarizerError(msg, 'Could not fetch transcript. Try again.', 'retry');
    }

    const segments: Array<{ text: string }> = response.segments;
    if (!segments || segments.length === 0) {
      throw new TranscriptNotFoundError();
    }

    const text = segments.map(s => s.text).join(' ');
    const title = await fetchVideoTitle(videoId);

    return { text, title };
  } catch (err: unknown) {
    if (err instanceof SummarizerError) throw err;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Could not establish connection') || msg.includes('Receiving end does not exist')) {
      throw new SummarizerError(msg, 'Reload the YouTube page and try again.', 'retry');
    }
    if (msg.includes('fetch') || msg.includes('Network')) throw new NetworkError();
    throw new SummarizerError(msg, 'Something went wrong. Try again.', 'retry');
  }
}
