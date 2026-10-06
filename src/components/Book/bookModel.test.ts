import { describe, it, expect } from 'vitest';
import {
  clampPosition,
  computeProgress,
  countWords,
  formatProgress,
  formatTimeLeft,
  globalPageIndex,
  layoutBook,
  positionOfGlobalPage,
  splitIntoPages,
  stepPosition,
} from './bookModel';

const words = (n: number, w = 'word'): string =>
  Array.from({ length: n }, () => w).join(' ') + '.';

describe('splitIntoPages', () => {
  it('returns no pages for empty / whitespace input', () => {
    expect(splitIntoPages('')).toEqual([]);
    expect(splitIntoPages('  \n\n  ')).toEqual([]);
  });

  it('keeps a short text as a single page', () => {
    expect(splitIntoPages('Hello there. General Kenobi.')).toEqual([
      'Hello there. General Kenobi.',
    ]);
  });

  it('never loses or invents words', () => {
    const text = Array.from({ length: 40 }, (_, i) => words(30 + i)).join(
      '\n\n',
    );
    const pages = splitIntoPages(text, 100);
    expect(pages.length).toBeGreaterThan(5);
    expect(pages.join(' ').match(/\S+/g)?.length).toBe(countWords(text));
    expect(pages.every((p) => p.trim().length > 0)).toBe(true);
  });

  it('pages stay near the target and break between paragraphs when possible', () => {
    const text = Array.from({ length: 30 }, () => words(60)).join('\n\n');
    const pages = splitIntoPages(text, 150);
    for (const p of pages) {
      expect(countWords(p)).toBeLessThanOrEqual(240);
    }
    expect(
      pages.every((p) => p.split('\n\n').every((q) => q.endsWith('.'))),
    ).toBe(true);
  });

  it('splits one huge paragraph on sentence ends', () => {
    const para = Array.from(
      { length: 200 },
      (_, i) => `Sentence number ${i} is here.`,
    ).join(' ');
    const pages = splitIntoPages(para, 100);
    expect(pages.length).toBeGreaterThan(5);
    expect(pages.every((p) => p.endsWith('.'))).toBe(true);
  });

  it('splits a punctuation-free wall of text on word count', () => {
    const wall = Array.from({ length: 1000 }, () => 'lorem').join(' ');
    const pages = splitIntoPages(wall, 100);
    expect(pages.length).toBeGreaterThanOrEqual(10);
    expect(pages.reduce((n, p) => n + countWords(p), 0)).toBe(1000);
  });
});

describe('layout, clamping and stepping', () => {
  const chapters = [
    { title: 'A', text: words(500) },
    { title: 'Empty', text: '' },
    { title: 'C', text: words(500) },
  ];
  const layout = layoutBook(chapters, 100);

  it('empty book has no pages and clamps to 0,0', () => {
    const empty = layoutBook([], 100);
    expect(empty.totalPages).toBe(0);
    expect(clampPosition(empty, { chapter: 5, page: 5 })).toEqual({
      chapter: 0,
      page: 0,
    });
    expect(stepPosition(empty, { chapter: 0, page: 0 }, 1)).toBeNull();
    expect(computeProgress(empty, { chapter: 0, page: 0 }, 300).pageTotal).toBe(
      0,
    );
    expect(
      formatProgress(computeProgress(empty, { chapter: 0, page: 0 }, 300)),
    ).toBe('Empty book');
  });

  it('one-page book: no prev, no next, 100%', () => {
    const one = layoutBook([{ title: 'x', text: 'Just a few words.' }], 100);
    expect(one.totalPages).toBe(1);
    expect(stepPosition(one, { chapter: 0, page: 0 }, 1)).toBeNull();
    expect(stepPosition(one, { chapter: 0, page: 0 }, -1)).toBeNull();
    expect(computeProgress(one, { chapter: 0, page: 0 }, 300).percent).toBe(
      100,
    );
  });

  it('clamps positions beyond the end, negative, NaN and fractional', () => {
    const last = clampPosition(layout, { chapter: 99, page: 99 });
    expect(last.chapter).toBe(2);
    expect(last.page).toBe((layout.pages[2] ?? []).length - 1);
    expect(clampPosition(layout, { chapter: -3, page: -1 })).toEqual({
      chapter: 0,
      page: 0,
    });
    expect(clampPosition(layout, { chapter: NaN, page: 1.9 })).toEqual({
      chapter: 0,
      page: 1,
    });
    expect(clampPosition(layout, null)).toEqual({ chapter: 0, page: 0 });
    // a page index past the end of its chapter clamps within that chapter
    expect(clampPosition(layout, { chapter: 0, page: 50 }).chapter).toBe(0);
  });

  it('moves a position that points at a page-less chapter to a real one', () => {
    expect(clampPosition(layout, { chapter: 1, page: 0 }).chapter).toBe(2);
  });

  it('steps across chapter boundaries (skipping empty chapters) and stops at the ends', () => {
    const lastOfA = { chapter: 0, page: (layout.pages[0] ?? []).length - 1 };
    expect(stepPosition(layout, lastOfA, 1)).toEqual({ chapter: 2, page: 0 });
    expect(stepPosition(layout, { chapter: 2, page: 0 }, -1)).toEqual(lastOfA);
    expect(stepPosition(layout, { chapter: 0, page: 0 }, -1)).toBeNull();
    const end = positionOfGlobalPage(layout, 9999);
    expect(stepPosition(layout, end, 1)).toBeNull();
    expect(globalPageIndex(layout, end)).toBe(layout.totalPages - 1);
  });
});

describe('progress math', () => {
  const layout = layoutBook(
    [
      {
        title: 'One',
        text: Array.from({ length: 4 }, () => words(100)).join('\n\n'),
      },
      {
        title: 'Two',
        text: Array.from({ length: 4 }, () => words(100)).join('\n\n'),
      },
    ],
    100,
  );

  it('start of book is 0% with the full time left', () => {
    const p = computeProgress(layout, { chapter: 0, page: 0 }, 400);
    expect(p).toMatchObject({
      chapterNumber: 1,
      chapterTotal: 2,
      pageNumber: 1,
      percent: 0,
    });
    expect(p.wordsTotal).toBe(800);
    expect(p.minutesLeft).toBe(2);
  });

  it('midway counts real words, not pages', () => {
    const p = computeProgress(layout, { chapter: 1, page: 0 }, 100);
    expect(p.wordsRead).toBe(400);
    expect(p.percent).toBe(50);
    expect(p.minutesLeft).toBe(4);
    expect(p.chapterNumber).toBe(2);
  });

  it('last page reads as 100% and a nonsense wpm falls back safely', () => {
    const p = computeProgress(layout, { chapter: 1, page: 3 }, 0);
    expect(p.percent).toBe(100);
    expect(Number.isFinite(p.minutesLeft)).toBe(true);
  });

  it('formats time left and the progress line', () => {
    expect(formatTimeLeft(0)).toBe('done');
    expect(formatTimeLeft(NaN)).toBe('done');
    expect(formatTimeLeft(45)).toBe('~45m left');
    expect(formatTimeLeft(120)).toBe('~2h left');
    expect(formatTimeLeft(130)).toBe('~2h 10m left');
    expect(
      formatProgress(computeProgress(layout, { chapter: 1, page: 0 }, 100)),
    ).toBe('Chapter 2 of 2 · page 5 of 8 · 50% · ~4m left');
  });
});
