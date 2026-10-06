import { useDropzone } from 'react-dropzone';
import * as CONSTANTS from '../constants';
import type { SampleBook } from '../constants';
import type { BookMeta } from './bookModel';
import type { SavedPosition } from './storage';
import type { IngestProgress } from './ingestTypes';
import ContinueCard from './ContinueCard';

const accept = {
  [CONSTANTS.PDF_MIME_TYPE]: ['.pdf'],
  [CONSTANTS.EPUB_MIME_TYPE]: ['.epub'],
};

export interface LibraryPanelProps {
  library: readonly BookMeta[];
  /** The book the Continue card offers. */
  continueBook?: BookMeta | null;
  positions: Readonly<Record<string, SavedPosition>>;
  currentId: string | null;
  busy: IngestProgress | null;
  error: string | null;
  notice: string | null;
  confirmClear: boolean;
  onFile: (file: File) => void;
  onSample: (book: SampleBook) => void;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAsk: () => void;
  onClearConfirm: () => void;
  onClearCancel: () => void;
}

function IngestStatus({ busy }: { busy: IngestProgress }) {
  const known = busy.fraction !== undefined;
  return (
    <div role="status" aria-live="polite" className="book-ingest">
      <p className="book-ingest-label">{busy.label}</p>
      <progress
        max={100}
        {...(known ? { value: Math.round((busy.fraction ?? 0) * 100) } : {})}
        aria-label="Parsing progress"
      />
    </div>
  );
}

function DropArea({ p }: { p: LibraryPanelProps }) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: p.busy !== null,
    onDrop: (files) => {
      const f = files[0];
      if (f) {
        p.onFile(f);
      }
    },
  });
  return (
    <div
      {...getRootProps({
        className: `book-drop${isDragActive ? ' is-active' : ''}`,
      })}
    >
      <input
        {...getInputProps({ 'aria-label': 'Choose a PDF or EPUB file' })}
      />
      {p.busy ? (
        <IngestStatus busy={p.busy} />
      ) : (
        <>
          <p className="book-drop-title">Drop a PDF or EPUB here</p>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={open}
          >
            Choose a file
          </button>
          <p className="book-drop-hint">
            Runs entirely in your browser. Nothing is uploaded.
          </p>
        </>
      )}
    </div>
  );
}

function bookLabel(m: BookMeta, saved: SavedPosition | undefined): string {
  const by = m.author ? ` by ${m.author}` : '';
  const read = saved?.pct === undefined ? '' : `, ${saved.pct}% read`;
  return `Open ${m.title}${by}${read}`;
}

function RecentBooks({ p }: { p: LibraryPanelProps }) {
  // On the landing page a single saved book is the Continue card already.
  const shown = 2;
  if (p.library.length < shown) {
    return null;
  }
  return (
    <div className="book-recent">
      <h3>Library</h3>
      <ul>
        {p.library.map((m) => {
          const saved = p.positions[m.id];
          const where =
            saved?.pct === undefined ? 'not started' : `${saved.pct}%`;
          return (
            <li key={m.id} className={m.id === p.currentId ? 'is-current' : ''}>
              <button
                type="button"
                className="book-recent-open"
                onClick={() => p.onOpen(m.id)}
                aria-label={bookLabel(m, saved)}
              >
                <span className="book-recent-title">{m.title}</span>
                <span className="book-recent-meta">
                  {m.author || m.format.toUpperCase()} · {where}
                </span>
              </button>
              <button
                type="button"
                className="book-recent-remove"
                onClick={() => p.onRemove(m.id)}
                aria-label={`Remove ${m.title} from this browser`}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Samples({ p }: { p: LibraryPanelProps }) {
  return (
    <div className="book-samples">
      <h3>Public-domain samples</h3>
      <div className="book-samples-row">
        {CONSTANTS.SAMPLE_BOOKS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="btn btn-sm btn-outline"
            disabled={p.busy !== null}
            onClick={() => p.onSample(b)}
          >
            {b.title}
            <span className="book-sample-author"> {b.author}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Privacy({ p }: { p: LibraryPanelProps }) {
  return (
    <div className="book-privacy">
      <p>
        Books and your place are saved only in this browser (IndexedDB and local
        storage). They never leave your device.
      </p>
      {p.confirmClear ? (
        <p className="book-clear-confirm" role="alert">
          Delete every saved book and setting?{' '}
          <button
            type="button"
            className="btn btn-xs btn-error"
            onClick={p.onClearConfirm}
          >
            Yes, delete
          </button>{' '}
          <button
            type="button"
            className="btn btn-xs"
            onClick={p.onClearCancel}
          >
            Cancel
          </button>
        </p>
      ) : (
        <button
          type="button"
          className="book-link-button"
          onClick={p.onClearAsk}
        >
          Clear all stored data
        </button>
      )}
    </div>
  );
}

export default function LibraryPanel(p: LibraryPanelProps) {
  return (
    <section className="book-library" aria-label="Library">
      <DropArea p={p} />
      {p.error ? (
        <p className="book-error" role="alert">
          {p.error}
        </p>
      ) : null}
      {p.notice ? (
        <p className="book-notice" role="status">
          {p.notice}
        </p>
      ) : null}
      {p.continueBook ? (
        <ContinueCard
          book={p.continueBook}
          pct={p.positions[p.continueBook.id]?.pct}
          disabled={p.busy !== null}
          onOpen={p.onOpen}
          onRemove={p.onRemove}
        />
      ) : null}
      <Samples p={p} />
      <RecentBooks p={p} />
      <Privacy p={p} />
    </section>
  );
}
