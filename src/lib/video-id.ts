export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/([a-zA-Z0-9_-]{11})(?:$|[?&#])/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
