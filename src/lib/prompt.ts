import { MAX_TRANSCRIPT_CHARS } from '../config';

export function buildSummaryPrompt(transcript: string): string {
  const truncated = transcript.length > MAX_TRANSCRIPT_CHARS
    ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + '... [truncated]'
    : transcript;

  return `You are a helpful assistant that summarizes YouTube videos. Given a transcript, produce a detailed summary with the following sections:

## TL;DR
2-3 sentences capturing the video's core message.

## Key Points
- Point 1 with context
- Point 2 with context
- (continue as needed)

## Learnings / Takeaways
- What can the viewer take away?
- Actionable insights, frameworks, or mental models.

## Notable Quotes
> "Direct quote from the transcript" (if any memorable phrasing)

## Structure / Chapters
If the video has clear sections, break them down:
1. **Section name** — what it covers
2. **Section name** — what it covers

## Q&A
Anticipate 3-5 questions a viewer would likely ask after watching, and answer them based on the transcript.

## Evaluation & Critique
A balanced assessment of strengths and weaknesses.

Here is the full transcript:

${truncated}

Produce the summary in markdown. Be thorough — aim for 300-800 words.`;
}
