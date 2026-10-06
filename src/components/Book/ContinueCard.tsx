import type { BookMeta } from './bookModel';

/** First letters of the first two words, for the little cover tile. */
export const coverInitials = (title: string): string =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
    .toUpperCase();

interface Props {
  book: BookMeta;
  /** Percent read, if the book was ever opened. */
  pct: number | undefined;
  disabled: boolean;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}

/** "Continue reading: <title> - NN%" with an Open button. */
export default function ContinueCard({
  book,
  pct,
  disabled,
  onOpen,
  onRemove,
}: Props) {
  const read = pct ?? 0;
  return (
    <section
      className="landing-card landing-continue"
      aria-label="Continue reading"
    >
      <div className="landing-continue-book">
        <div className="landing-cover" aria-hidden="true">
          {coverInitials(book.title)}
        </div>
        <div className="landing-continue-text">
          <h3>Continue reading</h3>
          <p>
            {book.title} · {read}%
          </p>
        </div>
      </div>
      <div
        className="landing-continue-bar"
        role="progressbar"
        aria-label={`${book.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={read}
      >
        <i style={{ width: `${read}%` }} />
      </div>
      <button
        type="button"
        className="btn btn-primary landing-continue-open"
        disabled={disabled}
        onClick={() => onOpen(book.id)}
        aria-label={`Open ${book.title}, ${read}% read`}
      >
        Open
      </button>
      <button
        type="button"
        className="book-link-button landing-continue-remove"
        onClick={() => onRemove(book.id)}
        aria-label={`Remove ${book.title} from this browser`}
      >
        Remove from this browser
      </button>
    </section>
  );
}
