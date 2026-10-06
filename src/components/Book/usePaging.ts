import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clampPosition,
  computeProgress,
  globalPageIndex,
  layoutBook,
  stepPosition,
  type Book,
  type Position,
} from './bookModel';
import { loadPositions, saveCurrentBookId, savePosition } from './storage';

const START: Position = { chapter: 0, page: 0 };

export const isTypingTarget = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement &&
  (t.tagName === 'INPUT' ||
    t.tagName === 'TEXTAREA' ||
    t.tagName === 'SELECT' ||
    t.isContentEditable);

/** Page position within the open book: derived layout, turning, persistence. */
export function usePaging(book: Book | null, wpm: number) {
  const layout = useMemo(
    () => (book ? layoutBook(book.chapters) : null),
    [book],
  );
  const [position, setPosition] = useState<Position>(START);
  const [resumed, setResumed] = useState(false);
  // id of the book `position` belongs to - never save a stale position over another book's
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const turnDir = useRef<1 | -1 | 0>(0);

  // A different book opened: jump to its saved place (if any).
  useEffect(() => {
    turnDir.current = 0;
    if (!book || !layout) {
      setPosition(START);
      setResumed(false);
      setLoadedId(null);
      return;
    }
    const saved = clampPosition(layout, loadPositions()[book.id]);
    setPosition(saved);
    setResumed(saved.chapter > 0 || saved.page > 0);
    setLoadedId(book.id);
  }, [book, layout]);

  const safePos = useMemo(
    () => (layout ? clampPosition(layout, position) : START),
    [layout, position],
  );
  const progress = layout ? computeProgress(layout, safePos, wpm) : null;

  // Persist on every page change: current book + position + percent read.
  const percent = layout ? computeProgress(layout, safePos, 300).percent : 0;
  useEffect(() => {
    if (book && loadedId === book.id) {
      saveCurrentBookId(book.id);
      savePosition(book.id, safePos, percent);
    }
  }, [book, loadedId, safePos, percent]);

  const goTo = useCallback(
    (pos: Position): void => {
      if (!layout) {
        return;
      }
      const next = clampPosition(layout, pos);
      turnDir.current =
        globalPageIndex(layout, next) >= globalPageIndex(layout, safePos)
          ? 1
          : -1;
      setPosition(next);
      setResumed(false);
    },
    [layout, safePos],
  );

  const turn = useCallback(
    (delta: 1 | -1): boolean => {
      const next = layout ? stepPosition(layout, safePos, delta) : null;
      if (next) {
        goTo(next);
      }
      return next !== null;
    },
    [layout, safePos, goTo],
  );

  return { layout, safePos, progress, resumed, turnDir, goTo, turn };
}

/** Arrow keys / PageUp / PageDown turn pages (not while typing or in a dialog). */
export function usePageKeys(
  active: boolean,
  turn: (d: 1 | -1) => boolean,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) {
        return;
      }
      const forward = e.key === 'ArrowRight' || e.key === 'PageDown';
      const back = e.key === 'ArrowLeft' || e.key === 'PageUp';
      if (forward || back) {
        e.preventDefault();
        turn(forward ? 1 : -1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, turn]);
}
