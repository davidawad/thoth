export interface SentenceRange {
  start: number;
  end: number;
}

// A sentence ends at ./!/? followed by whitespace/end; decimal points stay
// within their number. Closing quotes and brackets belong to the sentence.
const SENTENCE_PATTERN = /[\s\S]+?(?:[.!?]+["')\]]*(?=\s|$)|$)\s*/g;

/** Sentence ranges within one paragraph, trimmed of trailing whitespace. */
export function sentenceRanges(text: string): SentenceRange[] {
  const ranges: SentenceRange[] = [];

  for (const match of text.matchAll(SENTENCE_PATTERN)) {
    const start = match.index;
    const end = start + match[0].trimEnd().length;
    if (end > start && match[0].trim().length > 0) ranges.push({ start, end });
  }

  return ranges;
}
