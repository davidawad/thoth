import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import DisplayReel from './DisplayReel';

describe('DisplayReel constructor', () => {
  it('stores text and displayTime unchanged, and hotCharInd as an integer', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer(),
        fc.double({ noNaN: true, min: 0, max: 1e6 }),
        (text, hotCharInd, displayTime) => {
          const reel = new DisplayReel(text, hotCharInd, displayTime);
          expect(reel.text).toBe(text);
          expect(reel.hotCharInd).toBe(hotCharInd);
          expect(reel.displayTime).toBe(displayTime);
        },
      ),
    );
  });

  it('parses a numeric string hotCharInd the same as the equivalent number', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1000 }), (n) => {
        const fromNumber = new DisplayReel('x', n, 0);
        const fromString = new DisplayReel('x', String(n), 0);
        expect(fromString.hotCharInd).toBe(fromNumber.hotCharInd);
      }),
    );
  });
});
