/*
  Client-side persistence. Everything stays in this browser.

  - IndexedDB ("thoth-library"): parsed book text/structure (too big for
    localStorage). One record per book id.
  - localStorage: small state only - current book id + per-book position, wpm.

  Every access is wrapped: private browsing / blocked storage / quota errors
  degrade to "nothing is saved" instead of breaking reading. The parse*
  functions are pure so malformed saved data is unit-testable.
*/
import type { Book, BookMeta, Position } from './bookModel';

export const LS_CURRENT_BOOK = 'thoth.currentBook';
export const LS_POSITIONS = 'thoth.positions';
export const LS_WPM = 'thoth.wpm';
export const LS_LIBRARY = 'thoth.libraryIndex';

export const MIN_WPM = 100;
export const MAX_WPM = 1000;
export const DEFAULT_WPM = 300;
export const MAX_LIBRARY_BOOKS = 5;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const safeJson = (raw: string | null): unknown => {
  if (raw === null) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export function clampWpm(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) {
    return DEFAULT_WPM;
  }
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(v)));
}

export function parseWpm(raw: string | null): number {
  return raw === null ? DEFAULT_WPM : clampWpm(raw);
}

/** A saved reading position, plus the percent read (for the library list). */
export type SavedPosition = Position & {
  pct?: number;
  /**
   * Offset of the current word inside its chapter. Unlike `page` it survives
   * re-pagination (text size, window size), so it is what resume uses when set.
   */
  word?: number;
};

const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

function parseOnePosition(v: unknown): SavedPosition | null {
  if (!isObj(v) || !isCount(v['chapter']) || !isCount(v['page'])) {
    return null;
  }
  const pct = v['pct'];
  const word = v['word'];
  return {
    chapter: Math.floor(v['chapter']),
    page: Math.floor(v['page']),
    ...(isCount(pct) && pct <= 100 ? { pct: Math.floor(pct) } : {}),
    ...(isCount(word) ? { word: Math.floor(word) } : {}),
  };
}

export function parsePositions(
  raw: string | null,
): Record<string, SavedPosition> {
  const data = safeJson(raw);
  const out: Record<string, SavedPosition> = {};
  if (!isObj(data)) {
    return out;
  }
  for (const [id, v] of Object.entries(data)) {
    const pos = parseOnePosition(v);
    if (pos) {
      out[id] = pos;
    }
  }
  return out;
}

function parseMeta(v: unknown): BookMeta | null {
  if (
    !isObj(v) ||
    typeof v['id'] !== 'string' ||
    typeof v['title'] !== 'string' ||
    typeof v['author'] !== 'string' ||
    typeof v['totalWords'] !== 'number' ||
    typeof v['chapterCount'] !== 'number'
  ) {
    return null;
  }
  return {
    id: v['id'],
    title: v['title'],
    author: v['author'],
    language: typeof v['language'] === 'string' ? v['language'] : '',
    format: v['format'] === 'pdf' ? 'pdf' : 'epub',
    addedAt: typeof v['addedAt'] === 'number' ? v['addedAt'] : 0,
    totalWords: v['totalWords'],
    chapterCount: v['chapterCount'],
  };
}

export function parseLibraryIndex(raw: string | null): BookMeta[] {
  const data = safeJson(raw);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(parseMeta).filter((m): m is BookMeta => m !== null);
}

/** Validates a record read back from IndexedDB; null if it is unusable. */
export function parseStoredBook(v: unknown): Book | null {
  if (
    !isObj(v) ||
    typeof v['id'] !== 'string' ||
    !Array.isArray(v['chapters'])
  ) {
    return null;
  }
  const chapters: Book['chapters'] = [];
  for (const c of v['chapters']) {
    if (isObj(c) && typeof c['text'] === 'string') {
      chapters.push({
        title: typeof c['title'] === 'string' ? c['title'] : '',
        text: c['text'],
      });
    }
  }
  const meta = parseMeta({ ...v, chapterCount: chapters.length });
  if (!meta || chapters.length === 0) {
    return null;
  }
  return { ...meta, chapters };
}

// ---- localStorage wrappers -------------------------------------------------

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // storage unavailable or full - reading still works, just not saved.
  }
}

export const loadWpm = (): number => parseWpm(lsGet(LS_WPM));
export const saveWpm = (wpm: number): void =>
  lsSet(LS_WPM, String(clampWpm(wpm)));

export const loadCurrentBookId = (): string | null => lsGet(LS_CURRENT_BOOK);
export const saveCurrentBookId = (id: string | null): void =>
  lsSet(LS_CURRENT_BOOK, id);

export const loadPositions = (): Record<string, SavedPosition> =>
  parsePositions(lsGet(LS_POSITIONS));
export function savePosition(
  id: string,
  pos: Position,
  pct?: number,
  word?: number,
): void {
  const all = loadPositions();
  all[id] = {
    ...pos,
    ...(pct === undefined ? {} : { pct }),
    ...(word === undefined ? {} : { word }),
  };
  lsSet(LS_POSITIONS, JSON.stringify(all));
}
export function forgetPosition(id: string): void {
  const all = loadPositions();
  delete all[id];
  lsSet(LS_POSITIONS, JSON.stringify(all));
}

export const loadLibraryIndex = (): BookMeta[] =>
  parseLibraryIndex(lsGet(LS_LIBRARY));
export const saveLibraryIndex = (metas: BookMeta[]): void =>
  lsSet(LS_LIBRARY, JSON.stringify(metas));

// ---- IndexedDB ---------------------------------------------------------------

const DB_NAME = 'thoth-library';
const STORE = 'books';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('indexedDB error'));
    } catch (e) {
      reject(e instanceof Error ? e : new Error('indexedDB unavailable'));
    }
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        t.onerror = () => {
          db.close();
          reject(t.error ?? new Error('transaction failed'));
        };
        t.onabort = t.onerror;
      }),
  );
}

/** Saves a book, then trims the library to the most recent MAX_LIBRARY_BOOKS. */
export async function putBook(book: Book): Promise<BookMeta[]> {
  await tx('readwrite', (s) => s.put(book));
  const { chapters: _chapters, ...meta } = book;
  const index = [meta, ...loadLibraryIndex().filter((m) => m.id !== book.id)];
  const kept = index.slice(0, MAX_LIBRARY_BOOKS);
  for (const dropped of index.slice(MAX_LIBRARY_BOOKS)) {
    await deleteBook(dropped.id);
  }
  saveLibraryIndex(kept);
  return kept;
}

export async function getBook(id: string): Promise<Book | null> {
  try {
    return parseStoredBook(await tx('readonly', (s) => s.get(id)));
  } catch {
    return null;
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    await tx('readwrite', (s) => s.delete(id));
  } catch {
    // nothing stored / unavailable
  }
}

/** Removes one book (text, library entry, position). Returns the new index. */
export async function removeBook(id: string): Promise<BookMeta[]> {
  await deleteBook(id);
  forgetPosition(id);
  const kept = loadLibraryIndex().filter((m) => m.id !== id);
  saveLibraryIndex(kept);
  if (loadCurrentBookId() === id) {
    saveCurrentBookId(null);
  }
  return kept;
}

// Every localStorage key this app writes starts with "thoth." or "thoth-"
// (position, wpm, theme, palette, text size, dim, heat map, ...).
const APP_KEY_PATTERN = /^thoth[.-]/;

/** Wipes every book and every saved setting this app wrote in this browser. */
export async function clearAllData(): Promise<void> {
  try {
    await tx('readwrite', (s) => s.clear());
  } catch {
    // nothing to clear / unavailable
  }
  try {
    const keys: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);

      if (key !== null && APP_KEY_PATTERN.test(key)) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      lsSet(key, null);
    }
  } catch {
    // storage unavailable - nothing was saved to clear.
  }
}
