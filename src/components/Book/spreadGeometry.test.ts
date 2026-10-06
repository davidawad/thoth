import { describe, expect, it } from 'vitest';
import { pageGeometry, wordsPerPage, INITIAL_FIT } from './spreadGeometry';

describe('pageGeometry', () => {
  it('two pages fill the height of a wide stage', () => {
    const g = pageGeometry({ w: 1400, h: 700 }, 2, 1);
    expect(g.ph).toBe(700);
    expect(g.pw).toBeLessThan(700);
    expect(g.pw * 2).toBeLessThanOrEqual(1400);
  });
  it('one page uses the whole phone width and height', () => {
    const g = pageGeometry({ w: 360, h: 520 }, 1, 1);
    expect(g.pw).toBe(360);
    expect(g.ph).toBe(520);
  });
  it('a larger text size means bigger type', () => {
    const a = pageGeometry({ w: 1200, h: 700 }, 2, 0);
    const b = pageGeometry({ w: 1200, h: 700 }, 2, 4);
    expect(b.fs).toBeGreaterThan(a.fs);
  });
});

describe('wordsPerPage', () => {
  it('shrinks with text size, grows with room, stays in bounds', () => {
    const small = wordsPerPage(
      pageGeometry({ w: 1200, h: 700 }, 2, 0),
      INITIAL_FIT,
    );
    const big = wordsPerPage(
      pageGeometry({ w: 1200, h: 700 }, 2, 4),
      INITIAL_FIT,
    );
    expect(big).toBeLessThan(small);
    const tiny = wordsPerPage(pageGeometry({ w: 200, h: 200 }, 1, 4), 0.3);
    expect(tiny).toBeGreaterThanOrEqual(30);
    expect(small).toBeLessThanOrEqual(420);
  });
  it('rounds to a multiple of 10 so tiny resizes keep the pagination', () => {
    const a = wordsPerPage(
      pageGeometry({ w: 1200, h: 700 }, 2, 1),
      INITIAL_FIT,
    );
    expect(a % 10).toBe(0);
  });
});
