import TextParsingTools from '../TextParsingTools';

/**
 * How long one word stays on screen, in ms, at `wpm` words per minute. The
 * base slot (60000 / wpm) is stretched for long words, commas and sentence
 * ends, then scaled by how difficult the word is (syllables + dictionary
 * familiarity). Shared by the landing Reader and the book spread so both pace
 * text identically.
 */
export function wordDisplayTime(word: string, wpm: number): number {
  let t = 60000 / wpm;

  // over six characters: a quarter longer
  if (word.length > 6) {
    t += t / 4;
  }

  // a comma: half as long again
  if (~word.indexOf(',')) {
    t += t / 2;
  }

  // sentence-ending punctuation: two and a half times
  if (/[.?!]/.test(word)) {
    t += t * 1.5;
  }

  // Scale continuously by word difficulty. Lower-case-initial words (articles,
  // pronouns, ...) and very short words are excluded.
  const lowerInitial = word.charAt(0) === word.charAt(0).toLowerCase();
  if (!lowerInitial && word.length > 2) {
    t *= TextParsingTools.wordDifficultyMultiplier(
      TextParsingTools.stripPunctuation(word).toLowerCase(),
    );
  }

  return t;
}
