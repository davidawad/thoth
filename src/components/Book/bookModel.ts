/*
  Pure data model + pagination + progress math for the book reader.

  A stored Book is chapters of plain text (paragraphs separated by a blank
  line). "Pages" are NOT stored: they are derived by splitting each chapter
  into ~PAGE_WORDS-word chunks on sentence/paragraph boundaries. That keeps
  the draft-js editor (which only ever receives ONE page) small no matter how
  long the book is, and keeps saved positions valid if page size is retuned
  (position = chapter index + page index inside the chapter, clamped on load).
*/

export interface Chapter {
  title: string;
  text: string;
}

export interface BookMeta {
  id: string;
  title: string;
  author: string;
  language: string;
  format: 'epub' | 'pdf';
  addedAt: number;
  totalWords: number;
  chapterCount: number;
}

export interface Book extends BookMeta {
  chapters: Chapter[];
}

export interface Position {
  chapter: number;
  page: number;
}

export interface PageRef {
  chapter: number;
  page: number;
  text: string;
  words: number;
}

export const PAGE_WORDS = 280;

export function countWords(text: string): number {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

/**
 * Splits text into pages of roughly `target` words, never cutting mid-sentence
 * when it can be avoided: it fills a page paragraph by paragraph; an oversized
 * paragraph is split on sentence ends; an oversized sentence (no punctuation,
 * e.g. a PDF dump) is split on word count. Never returns empty pages, except
 * `[]` for empty/whitespace-only input.
 */
export function splitIntoPages(text: string, target = PAGE_WORDS): string[] {
  const size = Math.max(20, Math.floor(target));
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Break paragraphs into units no bigger than `size` words.
  const units: string[] = [];
  const pushSentences = (para: string): void => {
    // Split on whitespace that follows sentence-ending punctuation; nothing
    // is ever dropped (a regex .match() would silently skip stray characters).
    const sentences = para
      .split(/(?<=[.!?…]["'”’)\]]*)\s+/)
      .map((x) => x + ' ');
    let buf: string[] = [];
    let bufWords = 0;
    const flush = (): void => {
      if (buf.length) {
        units.push(buf.join('').trim());
        buf = [];
        bufWords = 0;
      }
    };
    for (const s of sentences) {
      const w = countWords(s);
      if (w > size) {
        flush();
        const words = s.trim().split(/\s+/);
        for (let i = 0; i < words.length; i += size) {
          units.push(words.slice(i, i + size).join(' '));
        }
        continue;
      }
      if (bufWords + w > size) {
        flush();
      }
      buf.push(s);
      bufWords += w;
    }
    flush();
  };
  for (const p of paragraphs) {
    if (countWords(p) <= size) {
      units.push(p);
    } else {
      pushSentences(p);
    }
  }

  const pages: string[] = [];
  let cur: string[] = [];
  let curWords = 0;
  for (const u of units) {
    const w = countWords(u);
    // Start a new page when adding would overshoot by more than it undershoots.
    if (
      cur.length &&
      curWords + w > size &&
      curWords + w - size > size - curWords
    ) {
      pages.push(cur.join('\n\n'));
      cur = [];
      curWords = 0;
    }
    cur.push(u);
    curWords += w;
  }
  if (cur.length) {
    pages.push(cur.join('\n\n'));
  }
  return pages;
}

/**
 * Sentence-granular pagination for the spread: pages are filled to (but never
 * past) `target` words, breaking between sentences - even inside a paragraph,
 * as a printed book does - so pages come out nearly full instead of ending
 * early to keep a long paragraph whole. A single sentence longer than a page
 * is cut on word count. Paragraph breaks are kept (blank line).
 */
export function splitIntoFullPages(
  text: string,
  target = PAGE_WORDS,
): string[] {
  const size = Math.max(20, Math.floor(target));
  interface Piece {
    text: string;
    words: number;
    paraStart: boolean;
  }
  const pieces: Piece[] = [];
  for (const para of text.split(/\n{2,}/)) {
    const sentences = para
      .trim()
      .split(/(?<=[.!?…]["'”’)\]]*)\s+/)
      .filter(Boolean);
    sentences.forEach((sentence, i) => {
      const words = sentence.split(/\s+/).filter(Boolean);
      for (let w = 0; w < words.length; w += size) {
        const chunk = words.slice(w, w + size);
        pieces.push({
          text: chunk.join(' '),
          words: chunk.length,
          paraStart: i === 0 && w === 0,
        });
      }
    });
  }
  const pages: string[] = [];
  let out = '';
  let count = 0;
  for (const p of pieces) {
    if (count > 0 && count + p.words > size) {
      pages.push(out);
      out = '';
      count = 0;
    }
    out += out === '' ? p.text : (p.paraStart ? '\n\n' : ' ') + p.text;
    count += p.words;
  }
  if (out) {
    pages.push(out);
  }
  return pages;
}

/** Page layout of a whole book, computed once when a book is opened. */
export interface BookLayout {
  /** pages[c] = the pages of chapter c (a chapter with no text has 0 pages). */
  pages: string[][];
  /** pageWords[c][p] */
  pageWords: number[][];
  totalPages: number;
  totalWords: number;
  /** firstPage[c] = global (0-based) index of chapter c's first page. */
  firstPage: number[];
}

export function layoutBook(
  chapters: readonly Chapter[],
  target = PAGE_WORDS,
  strict = false,
): BookLayout {
  const pages = chapters.map((c) =>
    strict
      ? splitIntoFullPages(c.text, target)
      : splitIntoPages(c.text, target),
  );
  const pageWords = pages.map((ps) => ps.map(countWords));
  const firstPage: number[] = [];
  let total = 0;
  let words = 0;
  pages.forEach((ps, i) => {
    firstPage[i] = total;
    total += ps.length;
    words += (pageWords[i] ?? []).reduce((a, b) => a + b, 0);
  });
  return { pages, pageWords, totalPages: total, totalWords: words, firstPage };
}

/** Clamps any (possibly stale / malformed) position onto a real page. */
export function clampPosition(
  layout: BookLayout,
  pos: Partial<Position> | null | undefined,
): Position {
  if (layout.totalPages === 0) {
    return { chapter: 0, page: 0 };
  }
  const nonEmpty = layout.pages.map((p) => p.length > 0);
  const toInt = (n: unknown): number =>
    typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : 0;
  let chapter = Math.min(
    Math.max(toInt(pos?.chapter), 0),
    layout.pages.length - 1,
  );
  // A chapter with zero pages can't be shown: move to the next non-empty one
  // (or back to the previous if none follows).
  if (!nonEmpty[chapter]) {
    const fwd = nonEmpty.indexOf(true, chapter);
    chapter = fwd >= 0 ? fwd : nonEmpty.lastIndexOf(true);
  }
  const count = (layout.pages[chapter] ?? []).length;
  const page = Math.min(Math.max(toInt(pos?.page), 0), count - 1);
  return { chapter, page };
}

export function globalPageIndex(layout: BookLayout, pos: Position): number {
  return (layout.firstPage[pos.chapter] ?? 0) + pos.page;
}

/** Position of the global page index (clamped). */
export function positionOfGlobalPage(
  layout: BookLayout,
  index: number,
): Position {
  if (layout.totalPages === 0) {
    return { chapter: 0, page: 0 };
  }
  const g = Math.min(Math.max(Math.floor(index), 0), layout.totalPages - 1);
  for (let c = layout.pages.length - 1; c >= 0; c--) {
    const first = layout.firstPage[c] ?? 0;
    if ((layout.pages[c] ?? []).length > 0 && g >= first) {
      return { chapter: c, page: g - first };
    }
  }
  return { chapter: 0, page: 0 };
}

/** Next/previous page position, or null at the ends of the book. */
export function stepPosition(
  layout: BookLayout,
  pos: Position,
  delta: 1 | -1,
): Position | null {
  const g = globalPageIndex(layout, pos) + delta;
  if (g < 0 || g >= layout.totalPages) {
    return null;
  }
  return positionOfGlobalPage(layout, g);
}

export interface Progress {
  chapterNumber: number; // 1-based, among chapters that have pages
  chapterTotal: number;
  pageNumber: number; // 1-based global
  pageTotal: number;
  wordsRead: number; // words before the current page
  wordsTotal: number;
  percent: number; // 0..100 integer
  minutesLeft: number;
}

export function computeProgress(
  layout: BookLayout,
  pos: Position,
  wpm: number,
): Progress {
  const readable = layout.pages
    .map((p, i) => (p.length > 0 ? i : -1))
    .filter((i) => i >= 0);
  if (layout.totalPages === 0) {
    return {
      chapterNumber: 0,
      chapterTotal: 0,
      pageNumber: 0,
      pageTotal: 0,
      wordsRead: 0,
      wordsTotal: 0,
      percent: 0,
      minutesLeft: 0,
    };
  }
  const p = clampPosition(layout, pos);
  let wordsRead = 0;
  for (let c = 0; c < p.chapter; c++) {
    wordsRead += (layout.pageWords[c] ?? []).reduce((a, b) => a + b, 0);
  }
  for (let i = 0; i < p.page; i++) {
    wordsRead += layout.pageWords[p.chapter]?.[i] ?? 0;
  }
  const speed = Number.isFinite(wpm) && wpm > 0 ? wpm : 300;
  const wordsLeft = Math.max(layout.totalWords - wordsRead, 0);
  const pageTotal = layout.totalPages;
  const pageNumber = globalPageIndex(layout, p) + 1;
  return {
    chapterNumber: readable.indexOf(p.chapter) + 1,
    chapterTotal: readable.length,
    pageNumber,
    pageTotal,
    wordsRead,
    wordsTotal: layout.totalWords,
    // Finishing the final page reads as 100%, a fresh book as 0%.
    percent:
      pageNumber >= pageTotal
        ? 100
        : Math.floor((wordsRead / Math.max(layout.totalWords, 1)) * 100),
    minutesLeft: Math.ceil(wordsLeft / speed),
  };
}

export function formatTimeLeft(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 'done';
  }
  if (minutes < 60) {
    return `~${minutes}m left`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h}h left` : `~${h}h ${m}m left`;
}

export function formatProgress(p: Progress): string {
  if (p.pageTotal === 0) {
    return 'Empty book';
  }
  return `Chapter ${p.chapterNumber} of ${p.chapterTotal} · page ${p.pageNumber} of ${p.pageTotal} · ${p.percent}% · ${formatTimeLeft(p.minutesLeft)}`;
}

/**
 * The book the landing page's Continue card offers: the one read last (its
 * saved id) when it is still in the library, otherwise the newest entry
 * (the library index is kept newest first), otherwise none.
 */
export function pickContinueBook(
  library: readonly BookMeta[],
  currentId: string | null,
): BookMeta | null {
  return library.find((m) => m.id === currentId) ?? library[0] ?? null;
}
