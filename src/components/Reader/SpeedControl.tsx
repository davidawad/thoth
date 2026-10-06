interface Props {
  wpm: number;
  onChange: (wpm: number) => void;
}

/** Words-per-minute slider shown next to the play controls. */
export default function SpeedControl({ wpm, onChange }: Props) {
  return (
    <label className="readerSpeed">
      <span className="readerSpeedLabel">Speed</span>
      <input
        type="range"
        className="range range-xs"
        min={100}
        max={1000}
        step={10}
        value={wpm}
        aria-label="Reading speed in words per minute"
        aria-valuetext={`${wpm} words per minute`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="readerSpeedValue">{wpm} wpm</output>
    </label>
  );
}
