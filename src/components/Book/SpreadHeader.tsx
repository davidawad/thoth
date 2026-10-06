import PlaybackHead from '../PlaybackHead/PlaybackHead';
import { IconNext, IconPause, IconPlay, IconPrev } from './icons';

interface Props {
  bookTitle: string;
  chapterTitle: string;
  reel: { text: string; hotCharInd: number };
  before: string;
  after: string;
  playing: boolean;
  wpm: number;
  wordsRead: number;
  wordsTotal: number;
  onBack: () => void;
  onSettings: () => void;
  onWord: (delta: 1 | -1) => void;
  onTogglePlay: () => void;
}

/** Top nav: back link, title, and the playback head pill (prev / play / next + the word). */
export default function SpreadHeader(p: Props) {
  return (
    <header className="sp-nav">
      <div className="sp-nav-l">
        <button type="button" className="sp-back" onClick={p.onBack}>
          <span aria-hidden="true">‹</span> Back to landing
        </button>
        <h1 className="sp-ttl">
          {p.bookTitle}
          {p.chapterTitle &&
          p.chapterTitle.trim().toLowerCase() !==
            p.bookTitle.trim().toLowerCase() ? (
            <>
              <i aria-hidden="true"> · </i>
              <span>{p.chapterTitle}</span>
            </>
          ) : null}
        </h1>
      </div>

      <div className="sp-strip" role="group" aria-label="Playback head">
        <button
          type="button"
          className="sp-ib"
          onClick={() => p.onWord(-1)}
          aria-label="Previous word"
        >
          <IconPrev />
        </button>
        <button
          type="button"
          className="sp-ib sp-play"
          onClick={p.onTogglePlay}
          aria-label={p.playing ? 'Pause' : 'Play'}
          aria-keyshortcuts="Space"
        >
          {p.playing ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          className="sp-ib"
          onClick={() => p.onWord(1)}
          aria-label="Next word"
        >
          <IconNext />
        </button>
        <div className="sp-head" aria-label={`Current word: ${p.reel.text}`}>
          <PlaybackHead
            currentReel={p.reel}
            before={p.before}
            after={p.after}
          />
        </div>
        <span className="sp-wpm" aria-hidden="true">
          {p.wpm} wpm
        </span>
      </div>

      <div className="sp-nav-r">
        <span className="sp-wordpos" aria-hidden="true">
          word {(p.wordsRead + 1).toLocaleString()} of{' '}
          {p.wordsTotal.toLocaleString()}
        </span>
        <button type="button" className="sp-link" onClick={p.onSettings}>
          Settings
        </button>
      </div>
    </header>
  );
}
