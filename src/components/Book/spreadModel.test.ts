import { describe, expect, it } from 'vitest';
import { layoutBook } from './bookModel';
import {
  indexBook,
  initialState,
  jumpTo,
  leftPage,
  locOfPage,
  relayout,
  settle,
  spreadProgress,
  stepLoc,
  stepWord,
  turnView,
  whereIs,
} from './spreadModel';

const words = (n: number, tag: string): string =>
  Array.from({ length: n }, (_, i) => `${tag}${i}`).join(' ') + '.';
const chapters = [
  { title: 'One', text: words(100, 'a') },
  { title: 'Empty', text: '' },
  { title: 'Two', text: `${words(50, 'b')}\n\n${words(50, 'c')}` },
];
const ix = indexBook(layoutBook(chapters, 20));

describe('whereIs / locOfPage', () => {
  it('round-trips the first word of every page', () => {
    for (let g = 0; g < ix.layout.totalPages; g++) {
      expect(whereIs(ix, locOfPage(ix, g)).global).toBe(g);
      expect(whereIs(ix, locOfPage(ix, g)).word).toBe(0);
    }
  });
  it('clamps garbage and skips empty chapters', () => {
    expect(whereIs(ix, { chapter: 1, offset: 0 }).pos.chapter).toBe(2);
    expect(whereIs(ix, { chapter: 99, offset: 9999 }).global).toBe(
      ix.layout.totalPages - 1,
    );
    expect(whereIs(ix, { chapter: -3, offset: -5 }).global).toBe(0);
  });
});

describe('stepLoc', () => {
  it('crosses chapters, skipping the empty one, and stops at the ends', () => {
    const lastOfOne = { chapter: 0, offset: 99 };
    expect(stepLoc(ix, lastOfOne, 1)).toEqual({ chapter: 2, offset: 0 });
    expect(stepLoc(ix, { chapter: 2, offset: 0 }, -1)).toEqual(lastOfOne);
    expect(stepLoc(ix, { chapter: 0, offset: 0 }, -1)).toBeNull();
    expect(stepLoc(ix, { chapter: 2, offset: 99 }, 1)).toBeNull();
  });
  it('visits every word exactly once going forward', () => {
    let loc = { chapter: 0, offset: 0 };
    let n = 1;
    for (let next = stepLoc(ix, loc, 1); next; next = stepLoc(ix, loc, 1)) {
      loc = next;
      n++;
    }
    expect(n).toBe(ix.layout.totalWords);
  });
});

describe('view state', () => {
  it('turns by the span and puts the head on the first word shown', () => {
    const s0 = initialState();
    const s1 = turnView(ix, s0, 2, 1);
    expect(leftPage(ix, s1)).toBe(2);
    expect(whereIs(ix, s1.cursor).word).toBe(0);
    expect(leftPage(ix, turnView(ix, s1, 2, -1))).toBe(0);
    expect(turnView(ix, s0, 2, -1)).toBe(s0);
  });
  it('playing off the right page turns the spread', () => {
    let st = initialState();
    const perPage = ix.layout.pageWords[0]?.[0] ?? 0;
    for (let i = 0; i < perPage * 2 - 1; i++) {
      st = stepWord(ix, st, 2, 1);
    }
    expect(leftPage(ix, st)).toBe(0);
    st = stepWord(ix, st, 2, 1);
    expect(leftPage(ix, st)).toBe(2);
  });
  it('a jump inside the visible spread leaves the view alone', () => {
    const s = jumpTo(ix, initialState(), 2, locOfPage(ix, 1));
    expect(leftPage(ix, s)).toBe(0);
    expect(jumpTo(ix, s, 2, locOfPage(ix, 4)).anchor).toEqual(locOfPage(ix, 4));
  });
  it('settle follows the head when the span shrinks to one page', () => {
    const s = jumpTo(ix, initialState(), 2, locOfPage(ix, 1));
    expect(leftPage(ix, settle(ix, s, 1))).toBe(1);
  });
  it('keeps the same word across a re-pagination', () => {
    const loc = { chapter: 2, offset: 37 };
    const small = indexBook(layoutBook(chapters, 20));
    const big = indexBook(layoutBook(chapters, 60));
    const st = relayout(big, { cursor: loc, anchor: locOfPage(small, 3) });
    expect(st.cursor).toEqual(loc);
    expect(whereIs(big, st.cursor).global).toBe(leftPage(big, st));
  });
});

describe('spreadProgress', () => {
  it('reports pages, percent and minutes from real word counts', () => {
    const p = spreadProgress(ix, initialState(), 2, 100);
    expect(p).toMatchObject({ pageFrom: 1, pageTo: 2, percent: 0 });
    expect(p.pageTotal).toBe(ix.layout.totalPages);
    expect(p.minutesLeft).toBe(Math.ceil(ix.layout.totalWords / 100));
    const end = turnView(ix, initialState(), 1, 1);
    expect(spreadProgress(ix, end, 1, 100).percent).toBeGreaterThan(0);
    const last = jumpTo(ix, initialState(), 1, { chapter: 2, offset: 99 });
    expect(spreadProgress(ix, last, 1, 100).percent).toBe(100);
  });
});
