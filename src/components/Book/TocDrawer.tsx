import { useEffect, useRef } from 'react';
import type { BookLayout } from './bookModel';
import type { Chapter } from './bookModel';
import { countWords } from './bookModel';

interface Props {
  chapters: readonly Chapter[];
  layout: BookLayout;
  currentChapter: number;
  onPick: (chapter: number) => void;
  onClose: () => void;
}

/** The chapter's opening words: tells apart chapters that share a title. */
const snippet = (text: string): string => {
  const flat = text.slice(0, 120).replace(/\s+/g, ' ').trim();
  return flat.length > 64 ? `${flat.slice(0, 64).trimEnd()}…` : flat;
};

const FOCUSABLE =
  'button, [href], input, select, [tabindex]:not([tabindex="-1"])';

/** Slide-in table of contents: modal, Esc / backdrop to close, focus kept inside. */
export default function TocDrawer({
  chapters,
  layout,
  currentChapter,
  onPick,
  onClose,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    // focus the current chapter and scroll it into view
    (
      current.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    )?.focus();
    current.current?.scrollIntoView?.({ block: 'center' });
    return () => opener?.focus?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) {
      return;
    }
    const items = Array.from(
      panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  return (
    <div
      className="book-toc-backdrop"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="book-toc"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Table of contents"
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="book-toc-head">
          <h2>Contents</h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <ol className="book-toc-list">
          {chapters.map((c, i) => {
            const pages = layout.pages[i]?.length ?? 0;
            if (pages === 0) {
              return null;
            }
            const isCurrent = i === currentChapter;
            return (
              <li key={i}>
                <button
                  type="button"
                  ref={isCurrent ? current : undefined}
                  className={`book-toc-item${isCurrent ? ' is-current' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onPick(i)}
                >
                  <span className="book-toc-title">{c.title}</span>
                  <span className="book-toc-snippet">{snippet(c.text)}</span>
                  <span className="book-toc-meta">
                    p. {(layout.firstPage[i] ?? 0) + 1} ·{' '}
                    {countWords(c.text).toLocaleString()} words
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
