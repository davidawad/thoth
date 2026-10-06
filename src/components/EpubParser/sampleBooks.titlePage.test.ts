/*
  The shipped sample EPUBs all open with a title page and a contents listing
  (e.g. Phaedo: "PHAEDO / By Plato / Translated by ... / Contents /
  INTRODUCTION."). After ingest none of that may reach a chapter's text,
  while title/author/language still come from the file's metadata.
*/
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ingestEpub } from '../Book/epubIngest';

const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/sample-books',
);

const load = async (file: string) =>
  ingestEpub(
    new Uint8Array(readFileSync(path.join(dir, file))).buffer,
    file,
    'id',
    () => undefined,
  );

describe('sample EPUB title pages and contents are stripped at ingest', () => {
  it('Phaedo: first chapter starts at the real introduction', async () => {
    const book = await load('phaedo-plato.epub');
    const first = book.chapters[0]?.text ?? '';
    expect(first.startsWith('After an interval of some months')).toBe(true);
    expect(first.slice(0, 400)).not.toMatch(/Translated by|By Plato|Contents/);
    expect(book.title).toContain('Phaedo');
    expect(book.author).toContain('Plato');
    expect(book.language).toBe('en');
  }, 60000);

  it('Meditations: no chapter is the title page / contents list', async () => {
    const book = await load('meditations-marcus-aurelius.epub');
    for (const c of book.chapters) {
      expect(c.text.slice(0, 300)).not.toMatch(/By Marcus Aurelius\n\n/);
      expect(c.text.startsWith('MEDITATIONS\n\nBy')).toBe(false);
    }
    expect(book.chapters[0]?.title).toBe('INTRODUCTION');
    expect(book.chapters[0]?.text.slice(0, 300)).not.toMatch(
      /ROMAN EMPEROR|HIS FIRST BOOK/,
    );
    expect(book.title).toContain('Meditations');
  }, 60000);

  it('Zarathustra: the contents run is gone, chapters begin with prose', async () => {
    const book = await load('thus-spake-zarathustra-nietzsche.epub');
    const all = book.chapters.map((c) => c.text.slice(0, 500)).join('\n');
    expect(all).not.toMatch(/Translated By Thomas Common/i);
    expect(all).not.toMatch(/CONTENTS\./);
    expect(book.chapters[0]?.text.startsWith('INTRODUCTION BY')).toBe(false);
    expect(book.chapters[0]?.text.startsWith('THUS SPAKE')).toBe(false);
    expect(book.title).toContain('Zarathustra');
  }, 60000);
});
