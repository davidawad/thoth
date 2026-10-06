import { DEFAULT_WPM } from './defaults';
import { useCallback, useEffect, useRef, useState } from 'react';
import { focusIndex } from '../Reader/wordRow';
import type { AppSettings } from '../types';
import { positionOfGlobalPage, type Book } from './bookModel';
import {
  TEXT_SIZES,
  loadDim,
  loadTextSizeIndex,
  saveDim,
  saveTextSizeIndex,
  type DimMode,
} from './readingPrefs';
import SettingsRow, { progressText } from './SettingsRow';
import SpreadBook from './SpreadBook';
import SpreadHeader from './SpreadHeader';
import { leftPage, spreadProgress } from './spreadModel';
import TocDrawer from './TocDrawer';
import { applyTheme, getActiveTheme, nextTheme } from './theme';
import { useMedia } from './useMedia';
import { useSpreadKeys } from './useSpreadKeys';
import {
  neighbourWord,
  usePlayback,
  usePositionSaving,
  useReadState,
  useSpreadLayout,
  useStageSize,
  wordAt,
} from './useSpreadReader';

interface Props {
  book: Book;
  settings: Partial<AppSettings>;
  onSpeedChange: (wpm: number) => void;
  onClose: () => void;
  /** opens the app's Settings modal */
  onOpenSettings: () => void;
  /** a modal is open over the page: keys must not act behind it */
  modalOpen: boolean;
}

const PHONE_QUERY = '(max-width: 759px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Reading preferences the settings row edits (size, dim, theme); each persists itself. */
function useViewPrefs() {
  const [sizeIndex, setSizeIndex] = useState(loadTextSizeIndex);
  const [dim, setDim] = useState<DimMode>(loadDim);
  const [theme, setTheme] = useState(getActiveTheme);
  return {
    sizeIndex,
    dim,
    theme,
    setSize: (i: number): void => {
      const n = Math.min(Math.max(i, 0), TEXT_SIZES.length - 1);
      setSizeIndex(n);
      saveTextSizeIndex(n);
    },
    setDim: (d: DimMode): void => {
      setDim(d);
      saveDim(d);
    },
    setTheme: (id: string): void => {
      applyTheme(id);
      setTheme(id);
    },
  };
}

/** The Spotlight reading view: playback head up top, a two-page spread, settings along the bottom. */
export default function SpreadReader({
  book,
  settings,
  onSpeedChange,
  onClose,
  onOpenSettings,
  modalOpen,
}: Props) {
  const wpm = Number(settings.readingSpeed) || DEFAULT_WPM;
  const span: 1 | 2 = useMedia(PHONE_QUERY) ? 1 : 2;
  const reducedMotion = useMedia(REDUCED_QUERY);
  const prefs = useViewPrefs();
  const [playing, setPlaying] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setFontsTick] = useState(0);

  const stageRef = useRef<HTMLElement>(null);
  const stage = useStageSize(stageRef);
  const { ix, geom, onOverflow } = useSpreadLayout(
    book,
    stage,
    span,
    prefs.sizeIndex,
  );
  const [state, dispatch] = useReadState(book, ix, span);
  const progress = spreadProgress(ix, state, span, wpm);
  const stop = useCallback(() => setPlaying(false), []);
  usePlayback({ playing, stop, wpm }, ix, state.cursor, dispatch);
  const flush = usePositionSaving(book.id, ix, state.cursor, progress.percent);

  // Web fonts change line breaks: re-measure once they are in.
  useEffect(() => {
    void document.fonts?.ready.then(() => setFontsTick((n) => n + 1));
  }, []);

  const turn = useCallback(
    (delta: 1 | -1) => dispatch({ type: 'turn', delta }),
    [dispatch],
  );
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const { setTheme } = prefs;
  const cycleTheme = useCallback(
    () => setTheme(nextTheme(getActiveTheme())),
    [setTheme],
  );
  useSpreadKeys(!tocOpen && !modalOpen, { turn, togglePlay, cycleTheme });

  const left = leftPage(ix, state);
  const word = wordAt(ix, state.cursor);
  const wordsRead =
    ix.chapterWords.slice(0, state.cursor.chapter).reduce((a, b) => a + b, 0) +
    state.cursor.offset;

  return (
    <div className="sp-app" data-testid="spread-reader">
      <SpreadHeader
        bookTitle={book.title}
        chapterTitle={book.chapters[state.cursor.chapter]?.title ?? ''}
        reel={{ text: word, hotCharInd: word ? focusIndex(word) : -1 }}
        before={neighbourWord(ix, state.cursor, -1)}
        after={neighbourWord(ix, state.cursor, 1)}
        playing={playing}
        wpm={wpm}
        wordsRead={wordsRead}
        wordsTotal={ix.layout.totalWords}
        onBack={() => {
          flush();
          onClose();
        }}
        onSettings={onOpenSettings}
        onWord={(delta) => dispatch({ type: 'step', delta })}
        onTogglePlay={togglePlay}
      />

      <main id="main-content" className="sp-stage" ref={stageRef}>
        <SpreadBook
          ix={ix}
          state={state}
          span={span}
          geom={geom}
          dim={prefs.dim}
          lang={book.language}
          bookTitle={book.title}
          reducedMotion={reducedMotion}
          onOverflow={onOverflow}
          onPickWord={(pageGlobal, w) => {
            const pos = positionOfGlobalPage(ix.layout, pageGlobal);
            const start = ix.pageStart[pos.chapter]?.[pos.page] ?? 0;
            dispatch({
              type: 'jump',
              loc: { chapter: pos.chapter, offset: start + w },
            });
          }}
        />
      </main>

      <p className="sr-only" role="status">
        {progressText(progress)}
      </p>

      <SettingsRow
        wpm={wpm}
        onWpm={onSpeedChange}
        sizeIndex={prefs.sizeIndex}
        onSize={prefs.setSize}
        theme={prefs.theme}
        onTheme={prefs.setTheme}
        dim={prefs.dim}
        onDim={prefs.setDim}
        progress={progress}
        canPrev={left > 0}
        canNext={left + span < ix.layout.totalPages}
        onTurn={turn}
        onContents={() => {
          setSheetOpen(false);
          setPlaying(false);
          setTocOpen(true);
        }}
        sheetOpen={sheetOpen}
        onSheet={setSheetOpen}
      />

      {tocOpen ? (
        <TocDrawer
          chapters={book.chapters}
          layout={ix.layout}
          currentChapter={state.cursor.chapter}
          onPick={(c) => {
            dispatch({ type: 'jump', loc: { chapter: c, offset: 0 } });
            setTocOpen(false);
          }}
          onClose={() => setTocOpen(false)}
        />
      ) : null}
    </div>
  );
}
