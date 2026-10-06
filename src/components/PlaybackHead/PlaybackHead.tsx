interface ReelLike {
  text: string;
  hotCharInd: number;
}

// How many characters fit on each side of the pivot at full size, and across
// the whole word when there is no focus letter. Longer words are scaled down
// to fit rather than being cut off.
const HALF_CAPACITY = 7;
const WHOLE_CAPACITY = 14;
const MIN_SCALE = 0.5;

/**
 * Font scale (1 = full size) that keeps `text` inside the playback head:
 * the longer side of the focus letter decides, or the whole word when there
 * is no focus letter. Never below MIN_SCALE.
 */
export function fitScale(text: string, hot: number | null): number {
  const longest =
    hot === null
      ? text.length / (WHOLE_CAPACITY / HALF_CAPACITY)
      : Math.max(hot, text.length - hot - 1);

  if (longest <= HALF_CAPACITY) {
    return 1;
  }

  return Math.max(MIN_SCALE, HALF_CAPACITY / longest);
}

interface PlaybackHeadProps {
  currentReel: ReelLike;
  /** The word before / after the current one, shown quietly at either side. */
  before?: string;
  after?: string;
}

/**
 * The RSVP word: the focus letter sits on a fixed pivot at the centre, so the
 * eye never has to move. Set in the content face (Atkinson Hyperlegible); the
 * focus letter is bold and red. The neighbouring words are dimmed and smaller.
 */
export default function PlaybackHead({
  currentReel,
  before = '',
  after = '',
}: PlaybackHeadProps) {
  const hot =
    currentReel.hotCharInd >= 0 &&
    currentReel.hotCharInd < currentReel.text.length
      ? currentReel.hotCharInd
      : null;

  const scale = fitScale(currentReel.text, hot);

  return (
    <div className="playbackHead">
      <span className="playbackHeadSide playbackHeadSide--before" aria-hidden>
        {before}
      </span>
      <div
        className="Reader-canvas"
        style={scale < 1 ? { fontSize: `${scale.toFixed(3)}em` } : undefined}
      >
        {hot === null ? (
          <span className="playbackHeadWhole">{currentReel.text}</span>
        ) : (
          <>
            <span className="playbackHeadPre">
              {currentReel.text.slice(0, hot)}
            </span>
            <span className="playbackHeadHot">{currentReel.text[hot]}</span>
            <span className="playbackHeadPost">
              {currentReel.text.slice(hot + 1)}
            </span>
          </>
        )}
      </div>
      <span className="playbackHeadSide playbackHeadSide--after" aria-hidden>
        {after}
      </span>
    </div>
  );
}
