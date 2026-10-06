import { useEffect, useRef, useState } from 'react';
import Reader from '../Reader/Reader';
import type { AppSettings } from '../types';
import {
  formatProgress,
  positionOfGlobalPage,
  stepPosition,
  type Book,
  type BookLayout,
  type Position,
  type Progress,
} from './bookModel';
import TocDrawer from './TocDrawer';
import { usePageKeys } from './usePaging';

interface Props {
  book: Book;
  layout: BookLayout;
  pos: Position;
  progress: Progress;
  resumed: boolean;
  turnDir: React.MutableRefObject<1 | -1 | 0>;
  settings: Partial<AppSettings>;
  onSpeedChange: (wpm: number) => void;
  goTo: (p: Position) => void;
  turn: (d: 1 | -1) => boolean;
  onClose: () => void;
}

/** Fades/slides the page in on each turn (skipped for reduced motion). */
function usePageTurnAnimation(
  pageText: string,
  turnDir: React.MutableRefObject<1 | -1 | 0>,
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const dir = turnDir.current;
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (!el || dir === 0 || reduced || typeof el.animate !== 'function') {
      return;
    }
    el.animate(
      [
        { opacity: 0.25, transform: `translateX(${dir * 18}px)` },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 220, easing: 'ease-out' },
    );
  }, [pageText, turnDir]);
  return ref;
}

function BookHeader({
  book,
  onContents,
  onClose,
}: {
  book: Book;
  onContents: () => void;
  onClose: () => void;
}) {
  const byline = [
    book.author || null,
    book.language ? book.language.toUpperCase() : null,
    book.format.toUpperCase(),
    `${book.totalWords.toLocaleString()} words`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <header className="book-head">
      <div className="book-head-text">
        <h1 className="book-title">{book.title}</h1>
        <p className="book-byline">{byline}</p>
      </div>
      <div className="book-head-actions">
        <button
          type="button"
          className="btn btn-sm"
          aria-haspopup="dialog"
          onClick={onContents}
        >
          Contents
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={onClose}
        >
          Close book
        </button>
      </div>
    </header>
  );
}

function PageNav({ p }: { p: Props }) {
  const { layout, pos, progress } = p;
  return (
    <>
      <nav className="book-nav" aria-label="Page navigation">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => p.turn(-1)}
          disabled={!stepPosition(layout, pos, -1)}
          aria-label="Previous page"
        >
          ‹ Prev
        </button>
        <input
          type="range"
          className="range range-xs book-scrub"
          min={1}
          max={Math.max(progress.pageTotal, 1)}
          value={progress.pageNumber}
          onChange={(e) =>
            p.goTo(positionOfGlobalPage(layout, Number(e.target.value) - 1))
          }
          aria-label="Go to page"
          aria-valuetext={`Page ${progress.pageNumber} of ${progress.pageTotal}`}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => p.turn(1)}
          disabled={!stepPosition(layout, pos, 1)}
          aria-label="Next page"
        >
          Next ›
        </button>
      </nav>
      <p className="book-progress" data-testid="book-progress">
        {formatProgress(progress)}
      </p>
      <div
        className="book-bar"
        role="progressbar"
        aria-label="Book progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <div
          className="book-bar-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="book-keys">
        Arrow keys turn pages · Space plays and pauses
      </p>
    </>
  );
}

export default function BookView(p: Props) {
  const [tocOpen, setTocOpen] = useState(false);
  const pageText = p.layout.pages[p.pos.chapter]?.[p.pos.page] ?? '';
  const pageRef = usePageTurnAnimation(pageText, p.turnDir);
  usePageKeys(!tocOpen, p.turn);

  return (
    <article className="book" aria-label={`${p.book.title} reader`}>
      <BookHeader
        book={p.book}
        onContents={() => setTocOpen(true)}
        onClose={p.onClose}
      />
      {p.resumed ? (
        <p className="book-resumed" role="status">
          Continuing where you left off ({p.progress.percent}%).
        </p>
      ) : null}
      <p className="book-chapter" aria-live="polite">
        <span className="book-chapter-num">
          Chapter {p.progress.chapterNumber}
        </span>
        <span className="book-chapter-title">
          {p.book.chapters[p.pos.chapter]?.title}
        </span>
      </p>
      <div className="book-page" ref={pageRef}>
        <Reader
          {...p.settings}
          content={pageText}
          onSpeedChange={p.onSpeedChange}
          onFinished={() => p.turn(1)}
        />
      </div>
      <PageNav p={p} />
      {tocOpen ? (
        <TocDrawer
          chapters={p.book.chapters}
          layout={p.layout}
          currentChapter={p.pos.chapter}
          onPick={(c) => {
            p.goTo({ chapter: c, page: 0 });
            setTocOpen(false);
          }}
          onClose={() => setTocOpen(false)}
        />
      ) : null}
    </article>
  );
}
