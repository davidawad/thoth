/*
  Pure model for the two-page spread: where the current word is, which pages
  are on show, and how stepping a word / turning a page moves both.

  A position is a Loc: a chapter plus the offset of a word inside that chapter.
  Offsets (unlike page numbers) survive re-pagination, so the same Loc is valid
  when the text size or window changes the page length - which is what makes a
  saved position keep its meaning. Pages are derived from the BookLayout.
*/
import { DEFAULT_WPM } from './defaults';
import {
  clampPosition,
  globalPageIndex,
  positionOfGlobalPage,
  type BookLayout,
  type Position,
} from './bookModel';

export interface Loc {
  chapter: number;
  /** index of a word inside the chapter's text (whitespace-separated) */
  offset: number;
}

export interface BookIndex {
  layout: BookLayout;
  /** pageStart[c][p] = chapter offset of page p's first word */
  pageStart: number[][];
  chapterWords: number[];
  /** chapters that have at least one page, ascending */
  readable: number[];
  /** chapter titles, by chapter index (for the page running head) */
  chapterTitles: string[];
}

export function indexBook(
  layout: BookLayout,
  chapterTitles: readonly string[] = [],
): BookIndex {
  const pageStart: number[][] = [];
  const chapterWords: number[] = [];
  layout.pageWords.forEach((words, c) => {
    let acc = 0;
    pageStart[c] = words.map((w) => {
      const start = acc;
      acc += w;
      return start;
    });
    chapterWords[c] = acc;
  });
  const readable = layout.pages.flatMap((p, c) => (p.length > 0 ? [c] : []));
  return {
    layout,
    pageStart,
    chapterWords,
    readable,
    chapterTitles: [...chapterTitles],
  };
}

const START: Loc = { chapter: 0, offset: 0 };

/** Clamps a Loc onto a real word of a readable chapter. */
export function clampLoc(ix: BookIndex, loc: Loc): Loc {
  const first = ix.readable[0];
  if (first === undefined) {
    return START;
  }
  const want = Number.isFinite(loc.chapter) ? Math.floor(loc.chapter) : 0;
  const chapter =
    ix.readable.find((c) => c >= want) ?? ix.readable[ix.readable.length - 1];
  const c = chapter ?? first;
  const last = Math.max((ix.chapterWords[c] ?? 1) - 1, 0);
  const offset = Number.isFinite(loc.offset) ? Math.floor(loc.offset) : 0;
  return { chapter: c, offset: Math.min(Math.max(offset, 0), last) };
}

/** Global page index and in-page word index of a Loc. */
export function whereIs(
  ix: BookIndex,
  loc: Loc,
): { global: number; pos: Position; word: number } {
  const l = clampLoc(ix, loc);
  const starts = ix.pageStart[l.chapter] ?? [0];
  let page = 0;
  for (let p = starts.length - 1; p >= 0; p--) {
    if ((starts[p] ?? 0) <= l.offset) {
      page = p;
      break;
    }
  }
  const pos = { chapter: l.chapter, page };
  return {
    global: globalPageIndex(ix.layout, pos),
    pos,
    word: l.offset - (starts[page] ?? 0),
  };
}

/** The Loc of the first word of a global page (clamped). */
export function locOfPage(ix: BookIndex, global: number): Loc {
  const pos = positionOfGlobalPage(ix.layout, global);
  return {
    chapter: pos.chapter,
    offset: ix.pageStart[pos.chapter]?.[pos.page] ?? 0,
  };
}

/** Loc of a Position (used for old saved positions that have no word offset). */
export function locOfPosition(ix: BookIndex, pos: Partial<Position>): Loc {
  const p = clampPosition(ix.layout, pos);
  return { chapter: p.chapter, offset: ix.pageStart[p.chapter]?.[p.page] ?? 0 };
}

/** The word `delta` (+1/-1) away, across page and chapter boundaries; null at the ends. */
export function stepLoc(ix: BookIndex, loc: Loc, delta: 1 | -1): Loc | null {
  const l = clampLoc(ix, loc);
  const next = l.offset + delta;
  const count = ix.chapterWords[l.chapter] ?? 0;
  if (next >= 0 && next < count) {
    return { chapter: l.chapter, offset: next };
  }
  const at = ix.readable.indexOf(l.chapter);
  const other = ix.readable[at + delta];
  if (other === undefined) {
    return null;
  }
  return {
    chapter: other,
    offset: delta === 1 ? 0 : Math.max((ix.chapterWords[other] ?? 1) - 1, 0),
  };
}

export const sameLoc = (a: Loc, b: Loc): boolean =>
  a.chapter === b.chapter && a.offset === b.offset;

export interface ReadState {
  /** the current word (the playback head) */
  cursor: Loc;
  /** first word of the left page on show */
  anchor: Loc;
}

export const initialState = (loc: Loc = START): ReadState => ({
  cursor: loc,
  anchor: loc,
});

/** Global index of the left page on show. */
export const leftPage = (ix: BookIndex, st: ReadState): number =>
  whereIs(ix, st.anchor).global;

/**
 * Keeps the current word on show: when it is outside the visible pages the
 * view jumps to its page (so reading forward turns the spread by `span`).
 */
export function settle(ix: BookIndex, st: ReadState, span: 1 | 2): ReadState {
  const left = leftPage(ix, st);
  const here = whereIs(ix, st.cursor).global;
  if (here >= left && here < left + span) {
    return st;
  }
  return { ...st, anchor: locOfPage(ix, here) };
}

export function stepWord(
  ix: BookIndex,
  st: ReadState,
  span: 1 | 2,
  delta: 1 | -1,
): ReadState {
  const next = stepLoc(ix, st.cursor, delta);
  return next ? settle(ix, { ...st, cursor: next }, span) : st;
}

/** Turn the view by whole spreads; the head moves to the first word shown. */
export function turnView(
  ix: BookIndex,
  st: ReadState,
  span: 1 | 2,
  delta: 1 | -1,
): ReadState {
  const target = leftPage(ix, st) + delta * span;
  if (target < 0 || target >= ix.layout.totalPages) {
    return st;
  }
  const loc = locOfPage(ix, target);
  return { cursor: loc, anchor: loc };
}

/** Move the head to `loc`, scrolling the view only if it is not on show. */
export function jumpTo(
  ix: BookIndex,
  st: ReadState,
  span: 1 | 2,
  loc: Loc,
): ReadState {
  return settle(ix, { ...st, cursor: clampLoc(ix, loc) }, span);
}

/** Re-anchors a state after the layout changed (new page length). */
export function relayout(ix: BookIndex, st: ReadState): ReadState {
  const cursor = clampLoc(ix, st.cursor);
  return { cursor, anchor: locOfPage(ix, whereIs(ix, cursor).global) };
}

export interface SpreadProgress {
  /** 1-based first and last page on show */
  pageFrom: number;
  pageTo: number;
  pageTotal: number;
  percent: number;
  minutesLeft: number;
}

export function spreadProgress(
  ix: BookIndex,
  st: ReadState,
  span: 1 | 2,
  wpm: number,
): SpreadProgress {
  const total = ix.layout.totalPages;
  const left = leftPage(ix, st);
  const here = whereIs(ix, st.cursor);
  let read = 0;
  for (let c = 0; c < here.pos.chapter; c++) {
    read += ix.chapterWords[c] ?? 0;
  }
  read += st.cursor.offset;
  const words = Math.max(ix.layout.totalWords, 1);
  const speed = Number.isFinite(wpm) && wpm > 0 ? wpm : DEFAULT_WPM;
  const atEnd = here.global >= total - 1 && left + span >= total;
  return {
    pageFrom: total === 0 ? 0 : left + 1,
    pageTo: Math.min(left + span, total),
    pageTotal: total,
    percent: atEnd ? 100 : Math.floor((read / words) * 100),
    minutesLeft: Math.ceil(Math.max(ix.layout.totalWords - read, 0) / speed),
  };
}
