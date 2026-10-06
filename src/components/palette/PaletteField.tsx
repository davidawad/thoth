import { useId, useState } from 'react';
import { describeAccent } from './accentStatus';
import {
  applyStoredPalette,
  effectiveMode,
  readPaletteChoice,
  savePaletteChoice,
  type PaletteChoice,
} from './applyPalette';
import { normalizeHex } from './contrast';
import { PALETTES, checkAccent, type ColorMode } from './palettes';
import { DEFAULT_PALETTE, paletteSchema, type Palette } from './types';

function Swatch({ palette, mode }: { palette: Palette; mode: ColorMode }) {
  const tokens = PALETTES[palette][mode];

  return (
    <span
      className="palette-swatch"
      aria-hidden="true"
      style={{ background: tokens['--color-bg'] }}
    >
      <span
        className="palette-swatch-chip"
        style={{ background: tokens['--color-bg-elevated-2'] }}
      />
      <span
        className="palette-swatch-chip"
        style={{ background: tokens['--color-fg'] }}
      />
      <span
        className="palette-swatch-chip"
        style={{ background: tokens['--color-accent'] }}
      />
    </span>
  );
}

function currentMode(): ColorMode {
  return effectiveMode(document.documentElement.getAttribute('data-theme'));
}

/**
 * Palette picker (ported from Seshat): swatch cards, an optional custom accent
 * that must clear 3:1 contrast, and a reset. Choices save to localStorage and
 * apply immediately; nothing here touches the Reader's props.
 */
export default function PaletteField() {
  const name = useId();
  const hexId = useId();
  const colorId = useId();
  const [choice, setChoice] = useState<PaletteChoice>(readPaletteChoice);
  // null = mirror the saved accent; a string = what's being typed (kept even
  // when invalid so a half-typed hex isn't clobbered).
  const [typed, setTyped] = useState<string | null>(null);
  const mode = currentMode();
  const draft = typed ?? choice.customAccent ?? '';
  const status = describeAccent(draft, choice, mode);

  const commit = (next: PaletteChoice) => {
    setChoice(next);
    savePaletteChoice(next);
    applyStoredPalette();
  };

  const commitAccent = (value: string) => {
    setTyped(value);
    const hex = normalizeHex(value);

    if (value.trim() === '') {
      commit({ ...choice, customAccent: null });
    } else if (hex !== null && checkAccent(hex, choice.palette, mode).ok) {
      commit({ ...choice, customAccent: hex });
    }
  };

  const pickerValue =
    normalizeHex(draft) ??
    choice.customAccent ??
    PALETTES[choice.palette][mode]['--color-accent'];
  const isDefault =
    choice.palette === DEFAULT_PALETTE && choice.customAccent === null;

  return (
    <fieldset className="palette-field" data-testid="palette-field">
      <legend className="text-lg font-semibold mb-2">Color palette</legend>
      <p className="text-sm opacity-70 mb-3">
        Applies immediately, in light and dark. Every preset is checked against
        WCAG contrast thresholds. The sepia theme uses a palette&rsquo;s light
        colors.
      </p>
      <div
        className="palette-grid"
        role="radiogroup"
        aria-label="Color palette"
      >
        {paletteSchema.options.map((palette) => (
          <label key={palette} className="palette-card">
            <input
              type="radio"
              name={name}
              value={palette}
              checked={choice.palette === palette}
              onChange={() => commit({ ...choice, palette })}
              data-testid={`palette-${palette}`}
            />
            <Swatch palette={palette} mode={mode} />
            <span className="palette-card-name">{PALETTES[palette].label}</span>
            <span className="palette-card-desc">
              {PALETTES[palette].description}
            </span>
          </label>
        ))}
      </div>

      <div className="accent-row">
        <label htmlFor={colorId}>Custom accent color</label>
        <input
          id={colorId}
          type="color"
          value={pickerValue}
          onChange={(event) => commitAccent(event.target.value)}
          data-testid="accent-color"
        />
        <label htmlFor={hexId}>Custom accent hex</label>
        <input
          id={hexId}
          type="text"
          spellCheck={false}
          autoComplete="off"
          placeholder="#3a7bd5"
          value={draft}
          onChange={(event) => commitAccent(event.target.value)}
          aria-invalid={!status.valid}
          data-testid="accent-hex"
        />
        <button
          type="button"
          className="btn btn-sm"
          disabled={isDefault && typed === null}
          onClick={() => {
            setTyped(null);
            commit({ palette: DEFAULT_PALETTE, customAccent: null });
          }}
          data-testid="palette-reset"
        >
          Reset to default
        </button>
      </div>
      <output
        className={`text-sm mt-2 block ${status.valid ? 'opacity-70' : 'accent-error'}`}
        data-testid="accent-status"
      >
        {status.message}
      </output>
    </fieldset>
  );
}

export type { Palette };
