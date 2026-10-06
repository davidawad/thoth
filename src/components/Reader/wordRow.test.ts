import { describe, it, expect } from 'vitest';
import DisplayReel from '../DisplayReel';
import { currentPosition, focusIndex, surroundingWords } from './wordRow';

const tapeOf = (...words: string[]) =>
  words.map((w) => new DisplayReel(w, 0, 100));

describe('focusIndex', () => {
  it.each([
    ['Remember', 3],
    ['how', 1],
    ['long', 1],
    ['thou', 1],
    ['hast', 1],
    ['already', 3],
    ['the', 1],
    ['gods', 1],
    ['nature', 1],
    ['Marcus', 1],
  ])('%s -> %i (unchanged from the original algorithm)', (word, want) => {
    expect(focusIndex(word)).toBe(want);
  });

  it('keeps the middle letter when the left half has no vowel', () => {
    expect(focusIndex('rhythm')).toBe(2);
    expect(focusIndex('nth')).toBe(1);
  });

  it('handles one-letter and empty words', () => {
    expect(focusIndex('a')).toBe(0);
    expect(focusIndex('x')).toBe(0);
    expect(focusIndex('')).toBe(0);
  });
});

describe('surroundingWords', () => {
  const tape = tapeOf('one', 'two', 'three');

  it('returns both neighbours in the middle', () => {
    expect(surroundingWords(tape, 1)).toEqual({
      before: 'one',
      after: 'three',
    });
  });

  it('has no word before the first', () => {
    expect(surroundingWords(tape, 0)).toEqual({ before: '', after: 'two' });
  });

  it('has no word after the last', () => {
    expect(surroundingWords(tape, 2)).toEqual({ before: 'two', after: '' });
  });

  it('is empty for a single word and for an empty tape', () => {
    expect(surroundingWords(tapeOf('solo'), 0)).toEqual({
      before: '',
      after: '',
    });
    expect(surroundingWords([], 0)).toEqual({ before: '', after: '' });
  });
});

describe('currentPosition', () => {
  const tape = tapeOf('a', 'b', 'c');

  it('finds the shown reel in the tape', () => {
    expect(currentPosition(tape, tape[2]!, 0)).toBe(2);
  });

  it('falls back to index - 1 for a reel that is not in the tape', () => {
    const stale = new DisplayReel('b', 0, 1);
    expect(currentPosition(tape, stale, 2)).toBe(1);
  });

  it('never goes below zero', () => {
    const stale = new DisplayReel('x', 0, 1);
    expect(currentPosition(tape, stale, 0)).toBe(0);
  });
});
