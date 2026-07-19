import { describe, it, expect } from 'vitest';
import { buildSummaryPrompt } from '../lib/prompt';

describe('buildSummaryPrompt', () => {
  it('includes transcript text', () => {
    const prompt = buildSummaryPrompt('Hello world');
    expect(prompt).toContain('Hello world');
  });

  it('includes all 7 sections', () => {
    const prompt = buildSummaryPrompt('test');
    const sections = ['TL;DR', 'Key Points', 'Learnings', 'Notable Quotes', 'Structure', 'Q&A', 'Evaluation'];
    for (const section of sections) {
      expect(prompt).toContain(section);
    }
  });

  it('truncates long transcripts at 80000 chars', () => {
    const longText = 'a'.repeat(100000);
    const prompt = buildSummaryPrompt(longText);
    expect(prompt).toContain('[truncated]');
    expect(prompt.length).toBeLessThan(90000);
  });

  it('does not truncate short transcripts', () => {
    const prompt = buildSummaryPrompt('short transcript');
    expect(prompt).not.toContain('[truncated]');
  });
});
