import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  normalizeHex,
  parseHex,
  readableOn,
  relativeLuminance,
} from './contrast';

describe('normalizeHex', () => {
  it('lowercases, expands shorthand, and adds the hash', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('1B1712')).toBe('#1b1712');
    expect(normalizeHex('  #1b1712 ')).toBe('#1b1712');
  });

  it('rejects non-hex input', () => {
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex('#12')).toBeNull();
    expect(normalizeHex('#gggggg')).toBeNull();
    expect(normalizeHex('#12345678')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for identical colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#1b1712', '#ece1c9')).toBe(
      contrastRatio('#ece1c9', '#1b1712'),
    );
  });

  it('reproduces the numbers documented in tokens.css', () => {
    expect(contrastRatio('#ece1c9', '#1b1712')).toBeCloseTo(13.74, 1);
    expect(contrastRatio('#b4903f', '#1b1712')).toBeCloseTo(5.94, 1);
    expect(contrastRatio('#7a5a1a', '#f8f0dd')).toBeCloseTo(5.6, 1);
  });

  it('returns null for invalid input', () => {
    expect(contrastRatio('nope', '#ffffff')).toBeNull();
  });
});

describe('relativeLuminance / parseHex', () => {
  it('spans 0..1', () => {
    expect(relativeLuminance(parseHex('#000') ?? [1, 1, 1])).toBe(0);
    expect(relativeLuminance(parseHex('#fff') ?? [0, 0, 0])).toBeCloseTo(1, 5);
  });
});

describe('readableOn', () => {
  it('picks white on dark and black on light backgrounds', () => {
    expect(readableOn('#1f5a94')).toBe('#ffffff');
    expect(readableOn('#ffd54a')).toBe('#000000');
  });

  it('always achieves at least 4.5:1 across a sweep of colors', () => {
    for (let r = 0; r < 256; r += 51) {
      for (let g = 0; g < 256; g += 51) {
        for (let b = 0; b < 256; b += 51) {
          const bg = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
          expect(contrastRatio(bg, readableOn(bg)) ?? 0).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      }
    }
  });
});
