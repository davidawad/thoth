import { useEffect } from 'react';

export const isTypingTarget = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement &&
  (t.tagName === 'INPUT' ||
    t.tagName === 'TEXTAREA' ||
    t.tagName === 'SELECT' ||
    t.isContentEditable);

/** Space on a focused button/link is that control's own click; leave it alone. */
const isActivatable = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.tagName === 'BUTTON' || t.tagName === 'A');

interface Handlers {
  turn: (delta: 1 | -1) => void;
  togglePlay: () => void;
  cycleTheme: () => void;
}

type KeyAction = 'next' | 'prev' | 'play' | 'theme';

function actionFor(e: KeyboardEvent): KeyAction | null {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    return 'next';
  }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    return 'prev';
  }
  if (e.code === 'Space' && !isActivatable(e.target)) {
    return 'play';
  }
  return e.key === 't' || e.key === 'T' ? 'theme' : null;
}

/**
 * Reading-view shortcuts: arrow keys / PageUp / PageDown turn pages, Space
 * plays and pauses, T cycles the theme. Never fires while typing in a field or
 * with a modifier held, and is switched off while a dialog is open.
 */
export function useSpreadKeys(active: boolean, h: Handlers): void {
  const { turn, togglePlay, cycleTheme } = h;
  useEffect(() => {
    if (!active) {
      return;
    }
    const run: Record<KeyAction, () => void> = {
      next: () => turn(1),
      prev: () => turn(-1),
      play: togglePlay,
      theme: cycleTheme,
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) {
        return;
      }
      const action = actionFor(e);
      if (action) {
        // T is a toggle with no default; the rest must not scroll or click
        if (action !== 'theme') {
          e.preventDefault();
        }
        run[action]();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, turn, togglePlay, cycleTheme]);
}
