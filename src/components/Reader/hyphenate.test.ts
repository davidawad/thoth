import { describe, expect, it } from 'vitest';
import { hyphenateWord } from './hyphenate';

describe('hyphenateWord', () => {
  it('leaves words shorter than the display size alone', () => {
    expect(hyphenateWord('how', 8)).toBe('how');
    expect(hyphenateWord('Remember', 9)).toBe('Remember');
  });

  it('splits a long word into hyphen-and-space separated pieces', () => {
    expect(hyphenateWord('disproportionately', 8)).toBe(
      'disprop- ortiona- tely',
    );
  });

  it('splits a word of 8-10 letters before its last three', () => {
    expect(hyphenateWord('beautiful', 8)).toBe('beauti- ful');
  });

  it('does not double a hyphen when the cut lands after an existing one', () => {
    const out = hyphenateWord('internationalization-minded', 8);

    expect(out).not.toMatch(/--/);
    // No letters are lost or added.
    expect(out.replace(/[- ]/g, '')).toBe('internationalizationminded');
  });

  it('only ever inserts hyphen+space separators (never drops letters)', () => {
    for (const word of [
      'incomprehensibilities',
      'supercalifragilisticexpialidocious',
      'electroencephalographically',
    ]) {
      const out = hyphenateWord(word, 8);

      expect(out.split(' ').join('').replace(/-/g, '')).toBe(word);
    }
  });
});
