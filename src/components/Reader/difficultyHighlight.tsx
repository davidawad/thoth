import type { ReactNode } from 'react';
import { CompositeDecorator } from 'draft-js';
import type { ContentBlock } from 'draft-js';
import TextParsingTools from '../TextParsingTools';

// Reading-difficulty heat map: every sentence in the loaded text gets a
// background from green (easy) to red (hard). Difficulty is RELATIVE to the
// rest of the text - a sentence's color is its percentile rank among all the
// sentences - so the map always shows where the hard parts of *this* text are,
// whatever its absolute level.

export interface Range {
  start: number;
  end: number;
}

// Extra difficulty per word in a sentence: longer sentences are harder to hold
// in mind, independent of how hard each word is.
const LENGTH_WEIGHT = 0.01;

// A sentence ends at ./!/? (plus any closing quote/bracket) followed by
// whitespace or the end of the block, so decimals like "3.5" don't split.
const SENTENCE_PATTERN = /[\s\S]+?(?:[.!?]+["')\]]*(?=\s|$)|$)\s*/g;

// Sentence ranges within one block (paragraph) of text, trimmed of trailing
// whitespace and with empty ranges dropped.
export function sentenceRanges(text: string): Range[] {
  const ranges: Range[] = [];

  for (const match of text.matchAll(SENTENCE_PATTERN)) {
    const start = match.index;
    const end = start + match[0].trimEnd().length;

    if (end > start && match[0].trim().length > 0) {
      ranges.push({ start, end });
    }
  }

  return ranges;
}

// Raw difficulty of one sentence: mean per-word difficulty multiplier (the same
// measure that scales how long each word is shown) plus a length term.
export function sentenceDifficulty(sentence: string): number {
  const words = sentence
    .split(/\s+/)
    .filter((word) => TextParsingTools.stripPunctuation(word).length > 0);

  if (words.length === 0) {
    return 0;
  }

  const total = words.reduce(
    (sum, word) => sum + TextParsingTools.wordDifficultyMultiplier(word),
    0,
  );

  return total / words.length + words.length * LENGTH_WEIGHT;
}

// The sentences of a whole text, block (line) by block, exactly as the editor
// will see them - so the strings match the editor's decorated ranges.
function sentencesOf(text: string): string[] {
  return text
    .split(/\r\n?|\n/)
    .flatMap((block) =>
      sentenceRanges(block).map(({ start, end }) => block.slice(start, end)),
    );
}

// Binary search in the ascending `sorted`: the index of the first element that
// is >= target, or, with `strict`, the first element that is > target.
function boundary(sorted: number[], target: number, strict: boolean): number {
  let low = 0;
  let high = sorted.length;

  while (low < high) {
    const mid = (low + high) >> 1;
    const value = sorted[mid] as number;
    const goesRight = strict ? value <= target : value < target;

    if (goesRight) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

// Maps each sentence's text to its difficulty percentile in [0, 1]: 0 is easier
// than every other sentence, 1 is harder than every other. Ties share the
// middle of their span; a lone sentence is 0.5. O(n log n), so a whole book
// (thousands of sentences) scores instantly.
export function scoreSentences(text: string): Map<string, number> {
  const sentences = sentencesOf(text);
  const raw = new Map(
    sentences.map((sentence) => [sentence, sentenceDifficulty(sentence)]),
  );
  const sorted = sentences
    .map((sentence) => raw.get(sentence) as number)
    .sort((a, b) => a - b);
  const scores = new Map<string, number>();

  for (const [sentence, value] of raw) {
    const below = boundary(sorted, value, false);
    const equal = boundary(sorted, value, true) - below;

    scores.set(sentence, (below + equal / 2) / sorted.length);
  }

  return scores;
}

// Green at 0 through yellow to red at 1. Translucent, so the text keeps its
// theme color and stays readable on the dark, light and sepia themes.
export function difficultyColor(score: number): string {
  const clamped = Math.min(1, Math.max(0, score));
  const hue = Math.round(120 * (1 - clamped));

  return `hsla(${hue}, 65%, 50%, 0.28)`;
}

// A draft-js decorator that tints each sentence of `text` by difficulty.
export function createDifficultyDecorator(text: string): CompositeDecorator {
  const scores = scoreSentences(text);

  const strategy = (
    block: ContentBlock,
    callback: (start: number, end: number) => void,
  ): void => {
    for (const { start, end } of sentenceRanges(block.getText())) {
      callback(start, end);
    }
  };

  const Sentence = ({
    children,
    decoratedText,
  }: {
    children?: ReactNode;
    decoratedText: string;
  }) => (
    <span
      className="difficultySentence"
      style={{
        backgroundColor: difficultyColor(scores.get(decoratedText) ?? 0.5),
      }}
    >
      {children}
    </span>
  );

  return new CompositeDecorator([{ strategy, component: Sentence }]);
}

// The legend under the editor explaining the colors; renders nothing when the
// heat map is off.
export function DifficultyLegend({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <p className="difficultyLegend">
      <span>Easier</span>
      <span className="difficultyLegendBar" aria-hidden="true" />
      <span>Harder</span>
      <span className="difficultyLegendNote">
        (relative to the rest of this text)
      </span>
    </p>
  );
}
