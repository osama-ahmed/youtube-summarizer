import { describe, it, expect } from 'vitest';
import { escapeHtml, renderMarkdown } from '../lib/markdown';

describe('escapeHtml', () => {
  it('escapes < > & " \'', () => {
    expect(escapeHtml('<script>alert("x")</script>'))
      .toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('passes plain text through', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersands first', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });
});

describe('renderMarkdown', () => {
  it('renders h1', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
  });

  it('renders h2', () => {
    expect(renderMarkdown('## Section')).toContain('<h2>Section</h2>');
  });

  it('renders h3', () => {
    expect(renderMarkdown('### Sub')).toContain('<h3>Sub</h3>');
  });

  it('renders bold', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('renders italic', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('renders unordered list items in single <ul>', () => {
    const result = renderMarkdown('- item1\n- item2\n- item3');
    const matches = result.match(/<ul>/g);
    expect(matches).toHaveLength(1);
    expect(result).toContain('<li>item1</li>');
    expect(result).toContain('<li>item2</li>');
    expect(result).toContain('<li>item3</li>');
    expect(result).toMatch(/<ul>.*<\/ul>/s);
  });

  it('renders ordered list items', () => {
    const result = renderMarkdown('1. first\n2. second');
    expect(result).toContain('<li>first</li>');
    expect(result).toContain('<li>second</li>');
  });

  it('renders blockquote', () => {
    expect(renderMarkdown('> quote')).toContain('<blockquote>quote</blockquote>');
  });

  it('escapes HTML in input (XSS)', () => {
    const result = renderMarkdown('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('wraps paragraphs in <p>', () => {
    const result = renderMarkdown('line1\n\nline2');
    expect(result).toMatch(/<p>line1<\/p>/);
    expect(result).toMatch(/<p>line2<\/p>/);
  });
});
