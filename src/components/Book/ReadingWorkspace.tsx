import { useMemo, type ReactNode } from 'react';
import Reader, { READER_STATS_PORTAL_ID } from '../Reader/Reader';
import * as CONSTANTS from '../constants';
import type { AppSettings } from '../types';
import LandingIntro from './LandingIntro';
import { pickContinueBook } from './bookModel';
import LibraryPanel from './LibraryPanel';
import SpreadReader from './SpreadReader';
import { loadCurrentBookId, loadPositions } from './storage';
import { useLibrary } from './useLibrary';

interface Props {
  settings: Partial<AppSettings>;
  onSpeedChange: (wpm: number) => void;
  onClearedAll: () => void;
  /** site chrome: shown on the landing page, replaced by the reading view's own bars */
  header: ReactNode;
  footer: ReactNode;
  onOpenSettings: () => void;
  modalOpen: boolean;
}

/**
 * Two screens. The landing page (RSVP card, text box, library, Continue card)
 * is the default and never opens a book by itself. Opening or loading a book
 * switches to the full-screen spread reader; Back to landing returns.
 */
export default function ReadingWorkspace({
  settings,
  onSpeedChange,
  onClearedAll,
  header,
  footer,
  onOpenSettings,
  modalOpen,
}: Props) {
  const lib = useLibrary(onClearedAll);
  const { book } = lib;

  // Re-read saved percentages whenever the library or the open book changes.
  const positions = useMemo(
    () => loadPositions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lib.library, book],
  );
  const continueBook = useMemo(
    () => pickContinueBook(lib.library, loadCurrentBookId()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lib.library, book],
  );

  if (book) {
    return (
      <SpreadReader
        key={book.id}
        book={book}
        settings={settings}
        onSpeedChange={onSpeedChange}
        onClose={lib.close}
        onOpenSettings={onOpenSettings}
        modalOpen={modalOpen}
      />
    );
  }

  return (
    <>
      {header}
      <div className="App">
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
            <LibraryPanel
              library={lib.library}
              continueBook={continueBook}
              positions={positions}
              currentId={null}
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
          </aside>
        </div>
      </div>
      {footer}
    </>
  );
}
