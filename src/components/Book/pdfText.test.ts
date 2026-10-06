import { describe, expect, it } from 'vitest';
import {
  buildPdfChapters,
  furnitureKey,
  linesToText,
  stripPageFurniture,
} from './pdfText';
import {
  isBlankPage,
  isImprintPage,
  isTocListingPage,
} from '../EpubParser/frontBackMatter';

describe('stripPageFurniture', () => {
  const body = (n: number): string[] => [
    'My Great Book',
    `Opening ${'z'.repeat(n)} line has real words in it.`,
    `Second ${'q'.repeat(n)} line continues the thought.`,
    ...Array.from(
      { length: 6 },
      (_, k) => `Filler ${k} unique text ${n}${k}x${'y'.repeat(k + n)}`,
    ),
    `Last ${'w'.repeat(n)} ends the thought.`,
    String(n),
  ];
  const pages = Array.from({ length: 10 }, (_, i) => body(i + 1));

  it('removes repeating headers and page numbers but keeps body', () => {
    const out = stripPageFurniture(pages);
    expect(out[3]?.[0]).toBe('Opening zzzz line has real words in it.');
    expect(out[3]).not.toContain('My Great Book');
    expect(out[3]).not.toContain('4');
    expect(out[3]?.length).toBe(9);
  });

  it('keeps a once-only edge line', () => {
    const p = pages.map((x) => [...x]);
    (p[2] as string[])[0] = 'Unique chapter heading';
    expect(stripPageFurniture(p)[2]?.[0]).toBe('Unique chapter heading');
  });

  it('handles empty input and empty pages', () => {
    expect(stripPageFurniture([])).toEqual([]);
    expect(stripPageFurniture([[], []])).toEqual([[], []]);
  });

  it('digit normalisation', () => {
    expect(furnitureKey('Page 12 of 300')).toBe(furnitureKey('Page 13 of 300'));
  });
});

describe('linesToText', () => {
  it('rejoins hyphenated words and builds paragraphs', () => {
    const t = linesToText([
      'This is a long line that fills the measure of the column fully.',
      'and has a recog-',
      'nition problem at the end of it all in the column.',
      'Short end.',
      'New paragraph starts here.',
    ]);
    expect(t).toContain('recognition problem');
    expect(t.split('\n\n').length).toBe(2);
  });
  it('empty in, empty out', () => {
    expect(linesToText([])).toBe('');
  });
});

describe('buildPdfChapters', () => {
  const texts = Array.from(
    { length: 45 },
    (_, i) => `Page ${i + 1} text with several words here.`,
  );
  it('groups by 20 pages when there is no outline', () => {
    const ch = buildPdfChapters(texts, [], []);
    expect(ch.map((c) => c.title)).toEqual([
      'Pages 1–20',
      'Pages 21–40',
      'Pages 41–45',
    ]);
  });
  it('uses outline entries, dedupes, ignores out-of-range, and keeps lead pages', () => {
    const ch = buildPdfChapters(
      texts,
      [],
      [
        { title: 'Two', page: 10 },
        { title: 'Dup', page: 10 },
        { title: 'One', page: 5 },
        { title: 'Nowhere', page: 999 },
        { title: '   ', page: 20 },
      ],
    );
    expect(ch.map((c) => c.title)).toEqual(['Opening', 'One', 'Two']);
  });
  it('drops skipped and empty pages; empty book gives no chapters', () => {
    const skip = texts.map((_, i) => i < 3);
    expect(
      buildPdfChapters(texts, skip, [])[0]?.text.startsWith('Page 4'),
    ).toBe(true);
    expect(buildPdfChapters([], [], [])).toEqual([]);
    expect(buildPdfChapters(['', ''], [], [])).toEqual([]);
  });
  it('single page', () => {
    expect(
      buildPdfChapters(['hello world'], [], []).map((c) => c.title),
    ).toEqual(['Page 1']);
  });
});

describe('PDF front/back matter detection', () => {
  it('imprint page', () => {
    expect(
      isImprintPage(
        'Copyright © 2019 Acme Press. All rights reserved. ISBN 978-3-16-148410-0. Printed in USA.',
      ),
    ).toBe(true);
  });
  it('a prose page mentioning copyright once is kept', () => {
    expect(
      isImprintPage(
        'The law of copyright © protects authors, he said, and went home.',
      ),
    ).toBe(false);
  });
  it('a long page is never an imprint page', () => {
    const long = 'All rights reserved. ISBN 123. ' + 'word '.repeat(400);
    expect(isImprintPage(long)).toBe(false);
  });
  it('toc listing', () => {
    const toc = Array.from(
      { length: 12 },
      (_, i) => `Chapter ${i + 1} ........ ${i * 10 + 3}`,
    );
    expect(isTocListingPage(toc)).toBe(true);
    expect(isTocListingPage(toc.slice(0, 3))).toBe(false);
    expect(
      isTocListingPage(
        Array.from({ length: 12 }, () => 'A normal sentence of prose here.'),
      ),
    ).toBe(false);
  });
  it('blank page', () => {
    expect(isBlankPage('  ')).toBe(true);
    expect(isBlankPage('x')).toBe(false);
  });
});
