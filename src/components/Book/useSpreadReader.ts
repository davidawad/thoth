/*
  State hooks behind the spread reader: pagination (geometry + learned fit),
  the reading position reducer, word-by-word playback and position saving.
*/
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
} from 'react';
import { layoutBook, type Book } from './bookModel';
import {
  PACING_SETTINGS_CHANGED,
  loadPacingSettings,
  wordDisplayTime,
  wordDisplayTimeWithMultiplier,
} from '../Reader/wordTiming';
import '../pacing';
import { tokenizePage } from './pageWords';
import { pacingPrecomputeCache } from '../pacing/precompute';
import { loadPositions, saveCurrentBookId, savePosition } from './storage';
import {
  INITIAL_FIT,
  MIN_FIT,
  pageGeometry,
  wordsPerPage,
  type PageGeometry,
  type StageSize,
} from './spreadGeometry';
import {
  clampLoc,
  indexBook,
  jumpTo,
  locOfPage,
  relayout,
  stepLoc,
  stepWord,
  turnView,
  whereIs,
  type BookIndex,
  type Loc,
  type ReadState,
} from './spreadModel';

export type Action =
  | { type: 'step'; delta: 1 | -1 }
  | { type: 'turn'; delta: 1 | -1 }
  | { type: 'jump'; loc: Loc }
  | { type: 'relayout' };

const SAVE_DELAY_MS = 400;
// Saved positions from before word offsets existed counted ~280-word pages.
const LEGACY_PAGE_WORDS = 280;

/** Where to resume: the saved word offset (survives re-pagination), else the saved page. */
function savedLoc(book: Book): Loc {
  const saved = loadPositions()[book.id];
  if (!saved) {
    return { chapter: 0, offset: 0 };
  }
  return {
    chapter: saved.chapter,
    offset: saved.word ?? saved.page * LEGACY_PAGE_WORDS,
  };
}

export function wordAt(ix: BookIndex, loc: Loc): string {
  const w = whereIs(ix, loc);
  const text = ix.layout.pages[w.pos.chapter]?.[w.pos.page] ?? '';
  return tokenizePage(text).words[w.word] ?? '';
}

export function sentenceAt(ix: BookIndex, loc: Loc): string {
  const chapter = ix.layout.pages[loc.chapter] ?? [];
  const tokens = tokenizePage(chapter.join(' '));
  const sentenceIndex = tokens.sentenceOf[loc.offset];
  if (sentenceIndex === undefined) return wordAt(ix, loc);
  return tokens.words
    .filter((_, index) => tokens.sentenceOf[index] === sentenceIndex)
    .join(' ');
}

/** The word `delta` away from `loc` as text ('' off the ends of the book). */
export function neighbourWord(ix: BookIndex, loc: Loc, delta: 1 | -1): string {
  const l = stepLoc(ix, loc, delta);
  return l ? wordAt(ix, l) : '';
}

/** Measured size of the area the spread fills; quantised so tiny resizes don't repaginate. */
export function useStageSize(ref: RefObject<HTMLElement | null>): StageSize {
  const [size, setSize] = useState<StageSize>(() => ({
    w: typeof window === 'undefined' ? 1200 : window.innerWidth,
    h:
      typeof window === 'undefined'
        ? 700
        : Math.max(window.innerHeight - 190, 300),
  }));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const q = (n: number): number => Math.max(Math.floor(n / 8) * 8, 160);
    const measure = (): void => {
      // the content box: the stage's own padding is breathing room, not page
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const padX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      setSize((s) => {
        const next = { w: q(r.width - padX), h: q(r.height - padY) };
        return s.w === next.w && s.h === next.h ? s : next;
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Pagination: pages are as long as the geometry says fits, tightened whenever
 * a page is measured to overflow (`onOverflow`). The learned fit is keyed to
 * the geometry it was learned for, so a resize starts from the estimate again.
 */
export function useSpreadLayout(
  book: Book,
  stage: StageSize,
  span: 1 | 2,
  sizeIndex: number,
): { ix: BookIndex; geom: PageGeometry; onOverflow: () => void } {
  const geom = useMemo(
    () => pageGeometry(stage, span, sizeIndex),
    [stage, span, sizeIndex],
  );
  const key = `${geom.pw}x${geom.ph}@${geom.fs}`;
  const [learned, setLearned] = useState({ key, fit: INITIAL_FIT });
  const fit = learned.key === key ? learned.fit : INITIAL_FIT;
  const target = wordsPerPage(geom, fit);
  const onOverflow = useCallback(() => {
    setLearned((s) => {
      const cur = s.key === key ? s.fit : INITIAL_FIT;
      return cur <= MIN_FIT ? s : { key, fit: Math.max(cur * 0.88, MIN_FIT) };
    });
  }, [key]);
  const ix = useMemo(
    () =>
      indexBook(
        layoutBook(book.chapters, target, true),
        book.chapters.map((c) => c.title),
      ),
    [book, target],
  );
  return { ix, geom, onOverflow };
}

/** The reading position (current word + visible pages) for the open book. */
export function useReadState(
  book: Book,
  ix: BookIndex,
  span: 1 | 2,
): [ReadState, Dispatch<Action>] {
  const [state, dispatch] = useReducer(
    (s: ReadState, a: Action): ReadState => {
      switch (a.type) {
        case 'step':
          return stepWord(ix, s, span, a.delta);
        case 'turn':
          return turnView(ix, s, span, a.delta);
        case 'jump':
          return jumpTo(ix, s, span, a.loc);
        case 'relayout':
          return relayout(ix, s);
      }
    },
    undefined,
    (): ReadState => {
      const loc = clampLoc(ix, savedLoc(book));
      return { cursor: loc, anchor: locOfPage(ix, whereIs(ix, loc).global) };
    },
  );
  // New pagination or span: keep the same word, re-anchor the pages around it.
  useLayoutEffect(() => dispatch({ type: 'relayout' }), [ix, span]);
  return [state, dispatch];
}

/**
 * Plays the book: after each word's display time (the same pacing as the
 * landing reader) the head steps to the next word, across pages and chapters,
 * and stops at the end of the book.
 */
export function usePlayback(
  run: { playing: boolean; stop: () => void; wpm: number },
  ix: BookIndex,
  cursor: Loc,
  dispatch: Dispatch<Action>,
): void {
  const { playing, stop, wpm } = run;
  const word = wordAt(ix, cursor);
  const sentence = sentenceAt(ix, cursor);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const [precomputed, setPrecomputed] = useState<{
    chapter: number;
    values: Float32Array;
  } | null>(null);
  useEffect(() => {
    const changed = (): void => setSettingsRevision((revision) => revision + 1);
    window.addEventListener(PACING_SETTINGS_CHANGED, changed);
    return () => window.removeEventListener(PACING_SETTINGS_CHANGED, changed);
  }, []);
  const chapterText = ix.layout.pages[cursor.chapter]?.join(' ') ?? '';
  const isLargeChapter = (chapterText.match(/\S+/g)?.length ?? 0) >= 1_000;
  useEffect(() => {
    if (!isLargeChapter) {
      setPrecomputed(null);
      return;
    }
    setPrecomputed(null);
    const { config, enabled } = loadPacingSettings();
    const pageTokens = tokenizePage(chapterText);
    const sentenceWords = new Map<number, string[]>();
    pageTokens.words.forEach((word, index) => {
      const sentence = pageTokens.sentenceOf[index]!;
      const words = sentenceWords.get(sentence) ?? [];
      words.push(word);
      sentenceWords.set(sentence, words);
    });
    const sentenceText = new Map(
      [...sentenceWords].map(([index, words]) => [index, words.join(' ')]),
    );
    const sentences = pageTokens.sentenceOf.map((sentence) =>
      sentenceText.get(sentence)!,
    );
    let live = true;
    void pacingPrecomputeCache
      .get(pageTokens.words.join(' '), config, { enabled, sentences })
      .then((values) => {
        if (live) setPrecomputed({ chapter: cursor.chapter, values });
      });
    return () => {
      live = false;
    };
  }, [chapterText, cursor.chapter, settingsRevision, isLargeChapter]);
  useEffect(() => {
    if (
      !playing ||
      (isLargeChapter && precomputed?.chapter !== cursor.chapter)
    ) {
      return;
    }
    const multiplier = isLargeChapter
      ? (precomputed!.values[cursor.offset] ?? 1)
      : undefined;
    const id = setTimeout(
      () => {
        if (stepLoc(ix, cursor, 1)) {
          dispatch({ type: 'step', delta: 1 });
        } else {
          stop();
        }
      },
      multiplier === undefined
        ? wordDisplayTime(word, wpm, sentence)
        : wordDisplayTimeWithMultiplier(word, wpm, multiplier),
    );
    return () => clearTimeout(id);
  }, [
    playing,
    stop,
    cursor,
    word,
    sentence,
    wpm,
    ix,
    dispatch,
    settingsRevision,
    precomputed,
    isLargeChapter,
  ]);
}

/** Saves the book + word shortly after it settles; returns a flush for leaving the book. */
export function usePositionSaving(
  bookId: string,
  ix: BookIndex,
  cursor: Loc,
  percent: number,
): () => void {
  const latest = useRef({ ix, cursor, percent });
  latest.current = { ix, cursor, percent };
  const flush = useCallback(() => {
    const l = latest.current;
    savePosition(
      bookId,
      whereIs(l.ix, l.cursor).pos,
      l.percent,
      l.cursor.offset,
    );
  }, [bookId]);

  useEffect(() => {
    saveCurrentBookId(bookId);
    const id = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [bookId, flush, ix, cursor, percent]);
  // flush on leaving, so Back to landing never loses the last words
  useEffect(() => flush, [flush]);
  return flush;
}
