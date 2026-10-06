import { useId, useState } from 'react';
import {
  HEAD_FONTS,
  applyStoredHeadFont,
  readHeadFont,
  saveHeadFont,
} from './headFont';

/**
 * Settings control for the playback head's typeface. Saves and applies
 * immediately; nothing here touches the Reader's props.
 */
export default function HeadFontField() {
  const id = useId();
  const [font, setFont] = useState<string>(readHeadFont);

  return (
    <section className="mb-6" data-testid="head-font-field">
      <h3 className="text-lg font-semibold mb-2">Playback head font</h3>
      <label htmlFor={id} className="label-text block mb-1">
        Typeface for the word you read
      </label>
      <select
        id={id}
        data-testid="head-font-select"
        className="select select-bordered select-sm w-full max-w-xs"
        value={font}
        onChange={(event) => {
          setFont(event.target.value);
          saveHeadFont(event.target.value);
          applyStoredHeadFont();
        }}
      >
        {HEAD_FONTS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-sm opacity-70 mt-2">
        Atkinson Hyperlegible is the default; it was designed so similar letters
        look different. The red focus letter stays bold in any font.
      </p>
    </section>
  );
}
