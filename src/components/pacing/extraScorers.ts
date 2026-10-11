import nlp from 'compromise';
import { syllable } from 'syllable';
import type { Scorer } from './scorers';
import { scorerRegistry } from './scorers';

/**
 * Compact, manually curated frequency sample calibrated to wordfreq's frequency bands.
 * Zipf estimates are approximated to one decimal to keep the shipped data tiny.
 * Unknown words use a conservative low-frequency default.
 * Source methodology: wordfreq (CC BY-SA 4.0), https://github.com/rspeer/wordfreq.
 */
const WORD_ZIPF: Readonly<Record<string, number>> = {
  the: 7.7,
  be: 7.4,
  to: 7.4,
  of: 7.3,
  and: 7.3,
  a: 7.2,
  in: 7.1,
  that: 6.9,
  have: 6.8,
  I: 6.8,
  it: 6.8,
  for: 6.7,
  not: 6.7,
  on: 6.6,
  with: 6.5,
  he: 6.5,
  as: 6.5,
  you: 6.5,
  do: 6.4,
  at: 6.4,
  this: 6.4,
  but: 6.3,
  his: 6.3,
  by: 6.2,
  from: 6.2,
  they: 6.2,
  we: 6.1,
  say: 6.1,
  her: 6.1,
  she: 6.1,
  or: 6.0,
  an: 6.0,
  will: 6.0,
  my: 6.0,
  one: 6.0,
  all: 5.9,
  would: 5.9,
  there: 5.9,
  their: 5.9,
  what: 5.8,
  so: 5.8,
  up: 5.8,
  out: 5.8,
  if: 5.8,
  about: 5.7,
  who: 5.7,
  get: 5.7,
  which: 5.7,
  go: 5.7,
  me: 5.7,
  when: 5.6,
  make: 5.6,
  can: 5.6,
  like: 5.6,
  time: 5.5,
  no: 5.5,
  just: 5.5,
  him: 5.5,
  know: 5.5,
  take: 5.4,
  people: 5.4,
  into: 5.4,
  year: 5.4,
  your: 5.4,
  good: 5.3,
  some: 5.3,
  could: 5.3,
  them: 5.3,
  see: 5.3,
  other: 5.2,
  than: 5.2,
  then: 5.2,
  now: 5.2,
  look: 5.2,
  only: 5.1,
  come: 5.1,
  its: 5.1,
  over: 5.1,
  think: 5.1,
  also: 5.0,
  back: 5.0,
  after: 5.0,
  use: 5.0,
  two: 5.0,
  how: 5.0,
  our: 5.0,
  work: 4.9,
  first: 4.9,
  well: 4.9,
  way: 4.9,
  even: 4.8,
  new: 4.8,
  want: 4.8,
  because: 4.8,
  these: 4.8,
  give: 4.7,
  day: 4.7,
  most: 4.7,
  us: 4.7,
  language: 4.4,
  sentence: 4.3,
  reader: 4.2,
  curious: 3.6,
  intricate: 3.3,
  serendipity: 2.8,
  ephemeral: 2.6,
  sesquipedalian: 1.5,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function words(text: string): string[] {
  return text.match(/[\p{L}]+(?:['’][\p{L}]+)*/gu) ?? [];
}

function wordRarityMultiplier(word: string): number {
  const zipf = WORD_ZIPF[word.toLocaleLowerCase()] ?? 3;
  // Lower Zipf frequency indicates a less familiar word and longer dwell.
  return clamp(1 + (5 - zipf) * 0.12, 0.75, 1.6);
}

export const wordRarityScorer: Scorer = {
  id: 'wordRarity',
  granularity: 'word',
  score: wordRarityMultiplier,
};

function clauseCount(sentence: string): number {
  const doc = nlp(sentence) as ReturnType<typeof nlp> & {
    conjunctions: () => { out: (format: 'array') => string[] };
  };
  const subordinateCount = doc
    .conjunctions()
    .out('array')
    .filter((term: string) =>
      /^(although|because|before|if|once|since|though|unless|until|when|whenever|where|whereas|while)$/i.test(
        term,
      ),
    ).length;
  const commaCount = (sentence.match(/,/g) ?? []).length;
  const wordCount = words(sentence).length;
  // Commas are only a weak proxy for clause boundaries, so cap their effect.
  return Math.max(
    1,
    1 + subordinateCount + Math.min(2, commaCount),
    Math.ceil(wordCount / 35),
  );
}

export const clauseDepthScorer: Scorer = {
  id: 'clauseDepth',
  granularity: 'sentence',
  score: (sentence) => clauseDepthScorer.scoreSentence?.(sentence) ?? 1,
  scoreSentence: (sentence) =>
    clamp(1 + (clauseCount(sentence) - 1) * 0.12, 1, 1.6),
};

function wordLengthMultiplier(word: string): number {
  const count = words(word).length;
  if (!count) return 1;
  const length =
    words(word).reduce((sum, item) => sum + item.length, 0) / count;
  const syllables =
    words(word).reduce((sum, item) => sum + Math.max(1, syllable(item)), 0) /
    count;
  return clamp(1 + (length - 5) * 0.025 + (syllables - 1.5) * 0.06, 0.75, 1.5);
}

export const wordLengthScorer: Scorer = {
  id: 'wordLength',
  granularity: 'word',
  score: wordLengthMultiplier,
  scoreSentence: (sentence) => {
    const tokens = words(sentence);
    if (!tokens.length) return 1;
    const meanLength =
      tokens.reduce((sum, word) => sum + word.length, 0) / tokens.length;
    const meanSyllables =
      tokens.reduce((sum, word) => sum + Math.max(1, syllable(word)), 0) /
      tokens.length;
    return clamp(
      1 + (meanLength - 5) * 0.025 + (meanSyllables - 1.5) * 0.06,
      0.75,
      1.5,
    );
  },
};

for (const scorer of [wordRarityScorer, clauseDepthScorer, wordLengthScorer]) {
  scorerRegistry.register(scorer);
}
