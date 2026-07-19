import JSZip from 'jszip';
import { getHistory } from './storage';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function exportHistoryToZip(): Promise<void> {
  const history = await getHistory();
  if (history.length === 0) return;

  const zip = new JSZip();

  for (const entry of history) {
    const folderName = slugify(entry.videoTitle);
    const folder = zip.folder(folderName);
    if (!folder) continue;

    folder.file('summary.md', entry.summary);
    folder.file('transcript.md', entry.transcript || '');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `youtube-summarizer-history-${formatDate()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
