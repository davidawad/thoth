import Epub from 'epubjs/lib/index';
import type { Section } from 'epubjs/lib/index';
import type { Book } from './bookModel';
import { countWords } from './bookModel';
import { buildChapters, type RawSection, type TocEntry } from './chapters';
import { extractBlocks } from './extractBlocks';
import { IngestError, yieldToBrowser, type ProgressFn } from './ingestTypes';

interface NavItem {
  label?: string;
  href?: string;
  subitems?: NavItem[];
}

// epubjs ships loose typings; describe just what is used here.
interface EpubBook {
  ready: Promise<unknown>;
  loaded: { navigation: Promise<{ toc?: NavItem[] }> };
  packaging?: { metadata?: Record<string, string> };
  spine: { each: (fn: (s: Section) => void) => void };
  load: (path: string) => Promise<unknown>;
  on: (ev: string, fn: () => void) => void;
  destroy: () => void;
}

function flattenToc(items: readonly NavItem[] | undefined): TocEntry[] {
  const out: TocEntry[] = [];
  const walk = (list: readonly NavItem[]): void => {
    for (const it of list) {
      if (it.href && it.label) {
        out.push({ label: it.label, href: it.href });
      }
      if (it.subitems?.length) {
        walk(it.subitems);
      }
    }
  };
  walk(items ?? []);
  return out;
}

const stripExt = (name: string): string => name.replace(/\.[^.]+$/, '');

const CORRUPT = 'This file could not be opened as an EPUB.';

async function openEpub(data: ArrayBuffer): Promise<EpubBook> {
  let book: EpubBook;
  try {
    book = Epub(data) as unknown as EpubBook;
  } catch {
    throw new IngestError('corrupt', CORRUPT);
  }
  // epub.js never rejects book.ready on a malformed archive - it emits
  // openFailed - so race the two or a bad file would hang forever.
  await new Promise<void>((resolve, reject) => {
    const fail = (): void => reject(new IngestError('corrupt', CORRUPT));
    book.on('openFailed', fail);
    book.ready.then(() => resolve(), fail);
  });
  return book;
}

async function readSections(
  book: EpubBook,
  onProgress: ProgressFn,
): Promise<RawSection[]> {
  const spine: Section[] = [];
  book.spine.each((s: Section) => {
    spine.push(s);
  });
  const raw: RawSection[] = [];
  for (const [i, section] of spine.entries()) {
    onProgress({
      phase: 'parsing',
      fraction: i / Math.max(spine.length, 1),
      label: `Reading section ${i + 1} of ${spine.length}`,
    });
    try {
      const contents = await section.load(book.load.bind(book));
      const { text, heading } = extractBlocks(contents as Element | string);
      raw.push({ href: section.href, text, heading });
    } catch {
      raw.push({ href: section.href, text: '', heading: '' });
    } finally {
      section.unload();
    }
    await yieldToBrowser();
  }
  return raw;
}

export async function ingestEpub(
  data: ArrayBuffer,
  fileName: string,
  id: string,
  onProgress: ProgressFn,
): Promise<Book> {
  const book = await openEpub(data);
  const meta = book.packaging?.metadata ?? {};
  const nav = await book.loaded.navigation.catch(() => undefined);
  const toc = flattenToc(nav?.toc);
  const raw = await readSections(book, onProgress);
  book.destroy();

  const chapters = buildChapters(raw, toc);
  if (chapters.length === 0) {
    throw new IngestError(
      'no-text',
      'No readable text was found in this EPUB.',
    );
  }
  const text = (key: string): string => (meta[key] ?? '').trim();
  return {
    id,
    title: text('title') || stripExt(fileName),
    author: text('creator'),
    language: text('language'),
    format: 'epub',
    addedAt: Date.now(),
    totalWords: chapters.reduce((n, c) => n + countWords(c.text), 0),
    chapterCount: chapters.length,
    chapters,
  };
}
