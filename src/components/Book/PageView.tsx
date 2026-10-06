import { memo } from 'react';
import { focusIndex } from '../Reader/wordRow';
import { positionOfGlobalPage } from './bookModel';
import { tokenizePage, type PageSentence } from './pageWords';
import { whereIs, type BookIndex, type Loc } from './spreadModel';

interface SentenceProps {
  sentence: PageSentence;
  /** word index (page-wide) of the playback head if it is in this sentence, else -1 */
  cur: number;
}

/** The current word: the focus letter is overlaid in bold red (see Spread.css) so the line never reflows. */
function CurrentWord({ text }: { text: string }) {
  const hot = focusIndex(text);
  return (
    <span className="sp-cur" data-testid="book-current-word">
      {text.slice(0, hot)}
      <span className="sp-hot" data-ch={text[hot]}>
        {text[hot]}
      </span>
      {text.slice(hot + 1)}
    </span>
  );
}

/**
 * One sentence. Only the sentence holding the playback head is split into
 * words (and is "lit"); every other sentence is a single text node, which
 * keeps a 280-word page cheap to re-render on every word step.
 */
const Sentence = memo(function Sentence({ sentence, cur }: SentenceProps) {
  const first = sentence.words[0]?.index ?? 0;
  if (cur < 0) {
    return (
      <>
        <span className="sp-sent" data-first={first}>
          {sentence.words.map((w) => w.text).join(' ')}
        </span>{' '}
      </>
    );
  }
  return (
    <>
      <span className="sp-sent is-lit" data-first={first}>
        {sentence.words.map((w, i) => (
          <span key={w.index}>
            {i > 0 ? ' ' : ''}
            {w.index === cur ? <CurrentWord text={w.text} /> : w.text}
          </span>
        ))}
      </span>{' '}
    </>
  );
});

interface Props {
  ix: BookIndex;
  /** global page index; out of range renders a blank sheet */
  global: number;
  bookTitle: string;
  /** which running head to print: the book (left page) or the chapter */
  head: 'book' | 'chapter';
  cursor: Loc | null;
  /** page text overflowed its box (the parent tightens pagination) */
  onOverflow?: () => void;
}

/** One printed page: running head, text with the spotlight, folio. */
export default function PageView({
  ix,
  global,
  bookTitle,
  head,
  cursor,
  onOverflow,
}: Props) {
  if (global < 0 || global >= ix.layout.totalPages) {
    return <div className="sp-page sp-page--blank" aria-hidden="true" />;
  }
  const pos = positionOfGlobalPage(ix.layout, global);
  const text = ix.layout.pages[pos.chapter]?.[pos.page] ?? '';
  const tokens = tokenizePage(text);
  const here = cursor ? whereIs(ix, cursor) : null;
  const curWord = here && here.global === global ? here.word : -1;
  const chapterTitle = ix.chapterTitles[pos.chapter] ?? '';

  return (
    <div className="sp-page" data-page={global + 1}>
      <p className="sp-runhead">{head === 'book' ? bookTitle : chapterTitle}</p>
      <div
        className="sp-body"
        ref={(el) => {
          if (el && onOverflow && el.scrollHeight > el.clientHeight + 2) {
            onOverflow();
          }
        }}
      >
        {tokens.paragraphs.map((sentences, p) => (
          <p key={p} className="sp-para">
            {sentences.map((s) => (
              <Sentence
                key={s.index}
                sentence={s}
                cur={
                  curWord >= 0 && tokens.sentenceOf[curWord] === s.index
                    ? curWord
                    : -1
                }
              />
            ))}
          </p>
        ))}
      </div>
      <p className="sp-folio">{global + 1}</p>
    </div>
  );
}
