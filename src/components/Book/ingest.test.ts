import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { bookIdFor, sniffKind } from './ingest';
import { ingestEpub } from './epubIngest';
import { buildChapters } from './chapters';
import { layoutBook, countWords } from './bookModel';

const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/sample-books',
);
const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

describe('sniffKind', () => {
  it('detects PDF by magic bytes even when misnamed', () => {
    expect(sniffKind(bytes('%PDF-1.7'), 'book.epub', '')).toBe('pdf');
  });
  it('detects EPUB zip by name or mime', () => {
    expect(sniffKind(bytes('PK\u0003\u0004'), 'x.epub', '')).toBe('epub');
    expect(
      sniffKind(bytes('PK\u0003\u0004'), 'x', 'application/epub+zip'),
    ).toBe('epub');
    expect(
      sniffKind(bytes('PK\u0003\u0004'), 'x.zip', 'application/zip'),
    ).toBeNull();
  });
  it('rejects other content and empty input', () => {
    expect(
      sniffKind(bytes('hello world'), 'a.pdf', 'application/pdf'),
    ).toBeNull();
    expect(sniffKind(new Uint8Array(0), 'a.pdf', '')).toBeNull();
  });
});

describe('bookIdFor', () => {
  it('is stable for the same bytes and differs for different bytes', async () => {
    const a = await bookIdFor(new Uint8Array([1, 2, 3]).buffer);
    expect(a).toBe(await bookIdFor(new Uint8Array([1, 2, 3]).buffer));
    expect(a).not.toBe(await bookIdFor(new Uint8Array([1, 2, 4]).buffer));
  });
});

describe('buildChapters', () => {
  const sec = (href: string, text: string, heading = '') => ({
    href,
    text,
    heading,
  });
  const long = Array.from({ length: 120 }, () => 'word').join(' ') + '.';

  it('groups spine sections under TOC entries and drops junk', () => {
    const ch = buildChapters(
      [
        sec('cover.xhtml', 'Cover'),
        sec('a.xhtml', long),
        sec('a2.xhtml', long),
        sec('b.xhtml', long),
      ],
      [
        { label: 'First', href: 'a.xhtml' },
        { label: 'Second', href: 'OEBPS/b.xhtml#top' },
      ],
    );
    expect(ch.map((c) => c.title)).toEqual(['First', 'Second']);
    expect(countWords(ch[0]?.text ?? '')).toBe(240);
  });
  it('falls back to headings and folds tiny sections when there is no TOC', () => {
    const ch = buildChapters(
      [
        sec('1', long, 'Alpha'),
        sec('2', 'tiny bit of text here ok'),
        sec('3', long),
      ],
      [],
    );
    expect(ch.map((c) => c.title)).toEqual(['Alpha', 'Section 2']);
  });
  it('empty input gives no chapters', () => {
    expect(buildChapters([], [])).toEqual([]);
  });
});

describe('ingestEpub on the shipped sample books', () => {
  for (const [file, title, author] of [
    ['meditations-marcus-aurelius.epub', 'Meditations', 'Marcus Aurelius'],
    ['phaedo-plato.epub', 'Phaedo', 'Plato'],
    [
      'thus-spake-zarathustra-nietzsche.epub',
      'Thus Spake Zarathustra',
      'Friedrich',
    ],
  ] as const) {
    it(`${file}: metadata, chapters, paginates`, async () => {
      const buf = new Uint8Array(readFileSync(path.join(dir, file))).buffer;
      const book = await ingestEpub(buf, file, 'id', () => undefined);
      expect(book.title).toContain(title);
      expect(book.author).toContain(author);
      expect(book.language).toBe('en');
      expect(book.chapters.length).toBeGreaterThan(1);
      expect(
        book.chapters.every((c) => c.title.length > 0 && c.text.length > 0),
      ).toBe(true);
      const all = book.chapters.map((c) => c.text).join('\n');
      expect(all).not.toMatch(/START OF (THE|THIS) PROJECT GUTENBERG/i);
      expect(all).not.toMatch(/END OF (THE|THIS) PROJECT GUTENBERG/i);
      const layout = layoutBook(book.chapters);
      expect(layout.totalPages).toBeGreaterThan(20);
      expect(layout.totalWords).toBe(book.totalWords);
    }, 60000);
  }
});
