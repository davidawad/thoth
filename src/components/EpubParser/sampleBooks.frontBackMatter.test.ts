/*
  Loads the real EPUB files shipped under public/sample-books/ through the
  same spine-iteration + extractText + boilerplate-filtering pipeline
  EpubParser.tsx's openBook() uses, and asserts the first page that survives
  filtering is real book content - not the cover ("Cover") and not Project
  Gutenberg's license boilerplate.

  This is deliberately not a React Testing Library test of the EpubParser
  component itself (that would need to thread a File/FileReader through
  componentDidMount); it exercises the actual parsing pipeline against the
  actual shipped files, which is what actually proves the fix works. Mirrors
  fuzz/epub-extract-text.fuzz.js's approach of driving epub.js directly
  against real files rather than starting a browser.
*/
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Epub, { type Section } from 'epubjs/lib/index';
import extractText from './extractText';
import {
  stripGutenbergBoilerplate,
  isSkippableFrontOrBackMatter,
} from './frontBackMatter';

const sampleBooksDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/sample-books',
);

// Real ebooks with 150+ spine sections take a few seconds to unzip + parse
// sequentially - well past vitest's 5s default per-test timeout.
const PARSE_TIMEOUT_MS = 30000;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  // Deliberately not `buffer.buffer.slice(...)`: Node's Buffer.from/allocUnsafe
  // often backs the Buffer with an ArrayBuffer from a different realm than
  // vitest's jsdom test environment (confirmed: under vitest,
  // `Buffer.from([1]).buffer instanceof ArrayBuffer` is false even though
  // `new ArrayBuffer(1) instanceof ArrayBuffer` is true) - JSZip's internal
  // `input instanceof ArrayBuffer` support check then silently never
  // resolves the way epub.js expects. Copying into a fresh Uint8Array
  // allocates via *this* realm's Uint8Array/ArrayBuffer constructors.
  return new Uint8Array(buffer).buffer;
}

// Mirrors the pipeline in EpubParser.tsx's openBook(): build the spine,
// load + extract + strip boilerplate for every section, then drop
// whatever isSkippableFrontOrBackMatter flags as junk.
async function parseSampleBook(fileName: string): Promise<string[]> {
  const bookData = toArrayBuffer(
    readFileSync(path.join(sampleBooksDir, fileName)),
  );
  const book = Epub(bookData);
  await book.ready;

  const sections: Section[] = [];
  book.spine.each(function (section) {
    sections.push(section);
  });

  const pages: string[] = [];
  for (const section of sections) {
    const contents = await section.load(book.load.bind(book));
    const pageText = stripGutenbergBoilerplate(
      extractText(contents).replace(/\s+/g, ' ').trim(),
    );
    pages.push(pageText);
    section.unload();
  }

  return pages.filter(
    (page) => page.length > 0 && !isSkippableFrontOrBackMatter(page),
  );
}

describe('EPUB front/back-matter filtering against real shipped sample books', () => {
  it.each([
    'phaedo-plato.epub',
    'meditations-marcus-aurelius.epub',
    'thus-spake-zarathustra-nietzsche.epub',
  ])(
    'lands on real content for %s',
    async (fileName) => {
      const pages = await parseSampleBook(fileName);

      expect(pages.length).toBeGreaterThan(0);

      const firstPage = pages[0];
      expect(firstPage).toBeDefined();
      // Page 0 must not be the cover page's leaked <title>"Cover"</title>
      // text - checked as a whole-string/whole-word match (not a substring
      // check) since real narrative text legitimately contains words like
      // "discover"/"recover" that merely contain the substring "cover".
      expect(firstPage?.trim()).not.toBe('"Cover"');
      expect(
        firstPage
          ?.toLowerCase()
          .split(/\s+/)
          .some((word) => word.replace(/[^a-z]/g, '') === 'cover'),
      ).toBe(false);
      // Page 0 must not be (or contain) Gutenberg's license boilerplate -
      // "gutenberg" is specific enough to check as a plain substring, no
      // real narrative text from these public-domain classics has any
      // legitimate reason to mention Project Gutenberg.
      expect(firstPage?.toLowerCase()).not.toContain('gutenberg');
      expect(firstPage?.toLowerCase()).not.toContain(
        'this ebook is for the use of anyone anywhere',
      );
    },
    PARSE_TIMEOUT_MS,
  );
});
