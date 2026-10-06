interface ReelLike {
  text: string;
  hotCharInd: number;
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

  return (
    <div className="playbackHead">
      <span className="playbackHeadSide playbackHeadSide--before" aria-hidden>
        {before}
      </span>
      <div className="Reader-canvas">
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
