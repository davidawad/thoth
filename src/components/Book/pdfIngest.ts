import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Book } from './bookModel';
import { countWords } from './bookModel';
import {
  buildPdfChapters,
  linesToText,
  stripPageFurniture,
  type OutlineEntry,
} from './pdfText';
import {
  isBlankPage,
  isImprintPage,
  isTocListingPage,
} from '../EpubParser/frontBackMatter';
import { IngestError, yieldToBrowser, type ProgressFn } from './ingestTypes';
import { BASE_PATH } from '../../basePath';

/** Fewer words per page than this on average means there is no real text layer. */
const MIN_AVG_WORDS_PER_PAGE = 8;

const stripExt = (name: string): string => name.replace(/\.[^.]+$/, '');

interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
}

const movedLine = (
  cur: string,
  lastY: number | null,
  y: number | undefined,
): boolean =>
  cur !== '' &&
  lastY !== null &&
  typeof y === 'number' &&
  Math.abs(y - lastY) > 3;

/** Lines of one page: break on hasEOL, or when the baseline (y) moves. */
export function itemsToLines(items: readonly unknown[]): string[] {
  const lines: string[] = [];
  let cur = '';
  let lastY: number | null = null;
  for (const raw of items) {
    const it = raw as Partial<TextItem>;
    if (typeof it.str !== 'string') {
      continue;
    }
    const y = it.transform?.[5];
    if (movedLine(cur, lastY, y)) {
      lines.push(cur);
      cur = '';
    }
    cur += it.str;
    lastY = typeof y === 'number' ? y : lastY;
    if (it.hasEOL) {
      lines.push(cur);
      cur = '';
    }
  }
  if (cur) {
    lines.push(cur);
  }
  return lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

async function readOutline(doc: PDFDocumentProxy): Promise<OutlineEntry[]> {
  try {
    const outline = await doc.getOutline();
    if (!outline) {
      return [];
    }
    const out: OutlineEntry[] = [];
    for (const item of outline) {
      try {
        let dest: unknown = item.dest;
        if (typeof dest === 'string') {
          dest = await doc.getDestination(dest);
        }
        if (Array.isArray(dest) && dest[0] !== undefined) {
          const ref = dest[0] as unknown;
          const page =
            typeof ref === 'number'
              ? ref
              : await doc.getPageIndex(
                  ref as Parameters<typeof doc.getPageIndex>[0],
                );
          out.push({ title: item.title, page });
        }
      } catch {
        // an unresolvable bookmark is just skipped
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function openDocument(
  PDFJS: typeof import('pdfjs-dist'),
  data: ArrayBuffer,
): Promise<{ doc: PDFDocumentProxy; task: { destroy: () => Promise<void> } }> {
  const task = PDFJS.getDocument({ data });
  try {
    return { doc: await task.promise, task };
  } catch (e) {
    if ((e as { name?: string } | null)?.name === 'PasswordException') {
      throw new IngestError(
        'encrypted',
        'This PDF is password-protected and cannot be read.',
      );
    }
    throw new IngestError('corrupt', 'This file could not be opened as a PDF.');
  }
}

async function extractPageLines(
  doc: PDFDocumentProxy,
  onProgress: ProgressFn,
): Promise<string[][]> {
  const numPages = doc.numPages;
  const pageLines: string[][] = [];
  for (let p = 1; p <= numPages; p++) {
    onProgress({
      phase: 'parsing',
      fraction: (p - 1) / numPages,
      label: `Reading page ${p} of ${numPages}`,
    });
    try {
      const page = await doc.getPage(p);
      pageLines.push(itemsToLines((await page.getTextContent()).items));
      page.cleanup();
    } catch {
      pageLines.push([]);
    }
    await yieldToBrowser();
  }
  return pageLines;
}

const NO_TEXT_MESSAGE =
  'This PDF has no selectable text - it looks like a scan or image-only PDF. Thoth cannot read it without OCR (text recognition), which is not supported. Try a text-based PDF or an EPUB.';

const asString = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : '';

export async function ingestPdf(
  data: ArrayBuffer,
  fileName: string,
  id: string,
  onProgress: ProgressFn,
): Promise<Book> {
  const PDFJS = await import('pdfjs-dist');
  PDFJS.GlobalWorkerOptions.workerSrc = `${BASE_PATH}/pdf.worker.min.mjs`;
  const { doc, task } = await openDocument(PDFJS, data);

  const pageLines = await extractPageLines(doc, onProgress);
  const rawWords = pageLines.reduce((n, l) => n + countWords(l.join(' ')), 0);
  if (doc.numPages === 0 || rawWords / doc.numPages < MIN_AVG_WORDS_PER_PAGE) {
    await task.destroy();
    throw new IngestError('no-text', NO_TEXT_MESSAGE);
  }

  const meta = await doc.getMetadata().catch(() => undefined);
  const info = (meta?.info ?? {}) as Record<string, unknown>;
  const outline = await readOutline(doc);
  await task.destroy();

  const cleaned = stripPageFurniture(pageLines);
  const pageTexts = cleaned.map(linesToText);
  const skip = cleaned.map(
    (lines, i) =>
      isBlankPage(pageTexts[i] ?? '') ||
      isImprintPage(pageTexts[i] ?? '') ||
      isTocListingPage(lines),
  );
  const chapters = buildPdfChapters(pageTexts, skip, outline);
  if (chapters.length === 0) {
    throw new IngestError('no-text', 'No readable text was found in this PDF.');
  }

  return {
    id,
    title: asString(info['Title']) || stripExt(fileName),
    author: asString(info['Author']),
    language: asString(info['Language']),
    format: 'pdf',
    addedAt: Date.now(),
    totalWords: chapters.reduce((n, c) => n + countWords(c.text), 0),
    chapters,
    chapterCount: chapters.length,
  };
}
