import { describe, expect, it } from 'vitest';
import { parseDim, parseTextSizeIndex } from './readingPrefs';

describe('readingPrefs', () => {
  it('falls back on garbage', () => {
    expect(parseTextSizeIndex(null)).toBe(1);
    expect(parseTextSizeIndex('9')).toBe(1);
    expect(parseTextSizeIndex('abc')).toBe(1);
    expect(parseTextSizeIndex('3')).toBe(3);
    expect(parseDim('nope')).toBe('full');
    expect(parseDim('soft')).toBe('soft');
  });
});
