import { useMemo } from 'react';
import Reader, { READER_STATS_PORTAL_ID } from '../Reader/Reader';
import * as CONSTANTS from '../constants';
import type { AppSettings } from '../types';
import BookView from './BookView';
import LandingIntro from './LandingIntro';
import { pickContinueBook } from './bookModel';
import LibraryPanel from './LibraryPanel';
import { loadCurrentBookId, loadPositions } from './storage';
import { useLibrary } from './useLibrary';
import { usePaging } from './usePaging';

interface Props {
  settings: Partial<AppSettings>;
  onSpeedChange: (wpm: number) => void;
  onClearedAll: () => void;
}

/** Page layout: reading column in the middle, library + stats in the sidebar. */
export default function ReadingWorkspace({
  settings,
  onSpeedChange,
  onClearedAll,
}: Props) {
  const wpm = Number(settings.readingSpeed) || CONSTANTS.DEFAULT_READING_SPEED;
  const lib = useLibrary(onClearedAll);
  const paging = usePaging(lib.book, wpm);
  const { book } = lib;
  const { layout, progress, safePos } = paging;

  // Re-read saved percentages whenever the library or the page changes.
  const positions = useMemo(
    () => loadPositions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lib.library, book, safePos],
  );

  const continueBook = useMemo(
    () => pickContinueBook(lib.library, loadCurrentBookId()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lib.library, book],
  );

  const panel = (variant: 'landing' | 'compact') => (
    <LibraryPanel
      variant={variant}
      library={lib.library}
      continueBook={continueBook}
      positions={positions}
      currentId={book?.id ?? null}
      busy={lib.busy}
      error={lib.error}
      notice={lib.notice}
      confirmClear={lib.confirmClear}
      onFile={(f) => void lib.ingest(f)}
      onSample={(s) => void lib.ingestSample(s)}
      onOpen={(id) => void lib.open(id)}
      onRemove={(id) => void lib.remove(id)}
      onClearAsk={() => lib.setConfirmClear(true)}
      onClearConfirm={() => void lib.clearAll()}
      onClearCancel={() => lib.setConfirmClear(false)}
    />
  );

  if (!(book && layout && progress)) {
    return (
      <div className="landing-grid">
        <main id="main-content" className="landing-main">
          <Reader
            {...settings}
            content={CONSTANTS.DEFAULT_TEXT}
            textLabel="Text to read"
            onSpeedChange={onSpeedChange}
          />
          <LandingIntro />
        </main>
        <aside className="landing-side">
          <div id={READER_STATS_PORTAL_ID} className="contents" />
          {panel('landing')}
        </aside>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)_20rem] gap-8 items-start">
      <div className="hidden lg:block" aria-hidden="true" />

      <main id="main-content" className="min-w-0">
        <BookView
          book={book}
          layout={layout}
          pos={safePos}
          progress={progress}
          resumed={paging.resumed}
          turnDir={paging.turnDir}
          settings={settings}
          onSpeedChange={onSpeedChange}
          goTo={paging.goTo}
          turn={paging.turn}
          onClose={lib.close}
        />
      </main>

      <aside className="flex flex-col gap-4">
        <div id={READER_STATS_PORTAL_ID} className="contents" />
        {panel('compact')}
      </aside>
    </div>
  );
}
