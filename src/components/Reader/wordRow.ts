/*
  Pure helpers for the RSVP word row: which letter of a word is the focus
  letter, and which words sit before / after the current one.
*/

/**
 * Index of the focus (red) letter: start in the middle of the word, then move
 * left until a vowel is hit. If there is none, the middle letter stays.
 */
export function focusIndex(word: string): number {
  const middle = ((word.length - 1) / 2) | 0;

  for (let j = middle; j >= 0; j--) {
    if (/[aeiou]/.test(word[j] ?? '')) {
      return j;
    }
  }

  return middle;
}

interface HasText {
  text: string;
}

export interface SurroundingWords {
  before: string;
  after: string;
}

/** Words at either side of `current` (an index into `tape`); '' off the ends. */
export function surroundingWords(
  tape: readonly HasText[],
  current: number,
): SurroundingWords {
  return {
    before: tape[current - 1]?.text ?? '',
    after: tape[current + 1]?.text ?? '',
  };
}

/**
 * Position of the word on screen. Playback keeps `index` pointing at the NEXT
 * word to show (so the current one is index - 1, or 0 right after a reset);
 * the identity lookup wins when the reel is still in the tape, which also
 * covers the paused-at-the-end state where `index` has already wrapped to 0.
 */
export function currentPosition(
  tape: readonly HasText[],
  currentReel: HasText,
  index: number,
): number {
  const found = tape.indexOf(currentReel);

  if (found >= 0) {
    return found;
  }

  return Math.max(index - 1, 0);
}
