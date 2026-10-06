import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_WPM,
  MAX_WPM,
  MIN_WPM,
  clampWpm,
  loadCurrentBookId,
  loadPositions,
  loadWpm,
  parseLibraryIndex,
  parsePositions,
  parseStoredBook,
  parseWpm,
  savePosition,
  saveWpm,
} from './storage';

// This jsdom/Node combination does not always expose a working localStorage,
// so tests install a Map-backed one (and a throwing one for private browsing).
function installStorage(throwing = false): void {
  const m = new Map<string, string>();
  const fail = (): never => {
    throw new Error('denied');
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (throwing ? fail() : (m.get(k) ?? null)),
      setItem: (k: string, v: string) => (throwing ? fail() : void m.set(k, v)),
      removeItem: (k: string) => (throwing ? fail() : void m.delete(k)),
      clear: () => m.clear(),
    },
  });
}

beforeEach(() => installStorage());
afterEach(() => vi.restoreAllMocks());

describe('wpm', () => {
  it('clamps and rounds', () => {
    expect(clampWpm(5)).toBe(MIN_WPM);
    expect(clampWpm(99999)).toBe(MAX_WPM);
    expect(clampWpm(333.6)).toBe(334);
    expect(clampWpm('420')).toBe(420);
  });
  it('falls back to the default on garbage', () => {
    expect(parseWpm(null)).toBe(DEFAULT_WPM);
    expect(parseWpm('abc')).toBe(DEFAULT_WPM);
    expect(clampWpm(NaN)).toBe(DEFAULT_WPM);
    expect(clampWpm(Infinity)).toBe(DEFAULT_WPM);
  });
  it('round-trips through localStorage', () => {
    saveWpm(450);
    expect(loadWpm()).toBe(450);
  });
});

describe('parsePositions', () => {
  it('reads valid entries', () => {
    expect(parsePositions('{"a":{"chapter":2,"page":7.9}}')).toEqual({
      a: { chapter: 2, page: 7 },
    });
  });
  it('rejects malformed JSON and wrong shapes', () => {
    expect(parsePositions('{not json')).toEqual({});
    expect(parsePositions('[1,2]')).toEqual({});
    expect(parsePositions('null')).toEqual({});
    expect(parsePositions(null)).toEqual({});
    expect(
      parsePositions(
        '{"a":{"chapter":"1","page":2},"b":{"chapter":-1,"page":0},"c":{"chapter":1,"page":1},"d":5}',
      ),
    ).toEqual({ c: { chapter: 1, page: 1 } });
  });
});

describe('parseLibraryIndex / parseStoredBook', () => {
  const meta = {
    id: 'x',
    title: 'T',
    author: 'A',
    language: 'en',
    format: 'pdf',
    addedAt: 5,
    totalWords: 10,
    chapterCount: 1,
  };
  it('keeps valid metas and drops broken ones', () => {
    expect(
      parseLibraryIndex(JSON.stringify([meta, { id: 1 }, null, 'x'])),
    ).toEqual([meta]);
    expect(parseLibraryIndex('oops')).toEqual([]);
    expect(parseLibraryIndex('{"a":1}')).toEqual([]);
  });
  it('fills defaults for optional fields', () => {
    const [m] = parseLibraryIndex(
      JSON.stringify([{ ...meta, format: 'weird', language: 3 }]),
    );
    expect(m?.format).toBe('epub');
    expect(m?.language).toBe('');
  });
  it('validates a stored book record', () => {
    const ok = parseStoredBook({
      ...meta,
      chapters: [{ title: 'c', text: 'hello' }, { text: 4 }],
    });
    expect(ok?.chapters).toEqual([{ title: 'c', text: 'hello' }]);
    expect(ok?.chapterCount).toBe(1);
    expect(parseStoredBook({ ...meta, chapters: [] })).toBeNull();
    expect(parseStoredBook({ ...meta })).toBeNull();
    expect(parseStoredBook(null)).toBeNull();
    expect(parseStoredBook('str')).toBeNull();
  });
});

describe('degrades when localStorage throws (private browsing)', () => {
  it('never throws, returns defaults', () => {
    installStorage(true);
    expect(loadWpm()).toBe(DEFAULT_WPM);
    expect(loadCurrentBookId()).toBeNull();
    expect(loadPositions()).toEqual({});
    expect(() => saveWpm(300)).not.toThrow();
    expect(() => savePosition('a', { chapter: 0, page: 0 })).not.toThrow();
  });
});

describe('saved word offset', () => {
  it('round-trips the chapter word offset next to page and percent', () => {
    savePosition('b', { chapter: 3, page: 4 }, 12, 987);
    expect(loadPositions()['b']).toEqual({
      chapter: 3,
      page: 4,
      pct: 12,
      word: 987,
    });
  });
  it('ignores a malformed word offset but keeps the position', () => {
    expect(parsePositions('{"a":{"chapter":1,"page":2,"word":-4}}')).toEqual({
      a: { chapter: 1, page: 2 },
    });
  });
});
