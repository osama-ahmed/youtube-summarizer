export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md);

  const html = escaped
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*] +(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. +(.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const withLists = html.replace(/(?:<li>[^]*?<\/li>\n?)+/g, '<ul>$&</ul>');

  return withLists.split('\n\n').filter(Boolean).map((block, i) => {
    block = block.trim();
    if (!block) return '';
    const prefix = i > 0 ? '<br/>' : '';
    if (/^<(h[1-3])/.test(block)) {
      const m = block.match(/^(<h[1-3]>.*?<\/h[1-3]>)\n?([\s\S]*)$/);
      if (m && m[2].trim()) {
        const rest = m[2].trim();
        if (/^<(blockquote|ul)/.test(rest)) {
          return prefix + m[1] + '\n' + rest;
        }
        return prefix + m[1] + `<p>${rest.replace(/\n/g, '<br/>')}</p>`;
      }
      return prefix + block;
    }
    if (/^<(blockquote|ul)/.test(block)) {
      return prefix + block;
    }
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('');
}
