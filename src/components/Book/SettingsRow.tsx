import { useId, useState, type ReactNode } from 'react';
import { MAX_WPM, MIN_WPM } from './storage';
import { formatTimeLeft } from './bookModel';
import {
  applyStoredPalette,
  effectiveMode,
  readPaletteChoice,
  savePaletteChoice,
} from '../palette/applyPalette';
import { PALETTES } from '../palette/palettes';
import { paletteSchema, type Palette } from '../palette/types';
import { THEMES } from '../constants';
import { DIM_MODES, TEXT_SIZES, type DimMode } from './readingPrefs';
import { IconContents, IconPagePrev, IconPageNext, IconSliders } from './icons';
import type { SpreadProgress } from './spreadModel';

interface Props {
  wpm: number;
  onWpm: (wpm: number) => void;
  sizeIndex: number;
  onSize: (index: number) => void;
  theme: string;
  onTheme: (id: string) => void;
  dim: DimMode;
  onDim: (d: DimMode) => void;
  progress: SpreadProgress;
  canPrev: boolean;
  canNext: boolean;
  onTurn: (delta: 1 | -1) => void;
  onContents: () => void;
  sheetOpen: boolean;
  onSheet: (open: boolean) => void;
}

function Seg<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: readonly { id: T; text: string }[];
  onPick: (id: T) => void;
}) {
  return (
    <div className="sp-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onPick(o.id)}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

function PaletteSwatches() {
  const [choice, setChoice] = useState(readPaletteChoice);
  const mode = effectiveMode(
    typeof document === 'undefined'
      ? null
      : document.documentElement.getAttribute('data-theme'),
  );
  const pick = (palette: Palette): void => {
    const next = { ...choice, palette };
    setChoice(next);
    savePaletteChoice(next);
    applyStoredPalette();
  };
  return (
    <div className="sp-ctl">
      <span className="sp-lbl">
        Palette{' '}
        <span className="sp-palname">{PALETTES[choice.palette].label}</span>
      </span>
      <div className="sp-swatches" role="radiogroup" aria-label="Color palette">
        {paletteSchema.options.map((p) => {
          const t = PALETTES[p][mode];
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={choice.palette === p}
              aria-label={`${PALETTES[p].label} palette`}
              title={PALETTES[p].label}
              className="sp-swatch"
              style={{
                background: `linear-gradient(135deg, ${t['--color-bg']} 50%, ${t['--color-accent']} 50%)`,
              }}
              onClick={() => pick(p)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function progressText(p: SpreadProgress): string {
  const pages =
    p.pageFrom === p.pageTo
      ? `page ${p.pageFrom} of ${p.pageTotal}`
      : `pages ${p.pageFrom}-${p.pageTo} of ${p.pageTotal}`;
  return `${pages} · ${p.percent}% · ${formatTimeLeft(p.minutesLeft)}`;
}

const DIM_OPTIONS = DIM_MODES.map((m) => ({ id: m, text: m }));
const THEME_OPTIONS = THEMES.map((t) => ({
  id: t.id,
  text: t.id,
}));

function PageButtons({ p }: { p: Props }) {
  return (
    <>
      <button
        type="button"
        className="sp-ib sp-ib--ring"
        onClick={() => p.onTurn(-1)}
        disabled={!p.canPrev}
        aria-label="Previous page"
      >
        <IconPagePrev />
      </button>
      <button
        type="button"
        className="sp-ib sp-ib--ring"
        onClick={() => p.onTurn(1)}
        disabled={!p.canNext}
        aria-label="Next page"
      >
        <IconPageNext />
      </button>
    </>
  );
}

/** Phone only: contents + settings-sheet toggles, progress text, page buttons. */
function CompactRow({ p }: { p: Props }) {
  return (
    <div className="sp-compact">
      <button
        type="button"
        className="sp-ib sp-ib--ring"
        onClick={p.onContents}
        aria-label="Contents"
        aria-haspopup="dialog"
      >
        <IconContents />
      </button>
      <button
        type="button"
        className="sp-ib sp-ib--ring"
        onClick={() => p.onSheet(!p.sheetOpen)}
        aria-label="Reading settings"
        aria-expanded={p.sheetOpen}
        aria-controls="sp-settings"
      >
        <IconSliders />
      </button>
      <span className="sp-pr sp-pr--compact">{progressText(p.progress)}</span>
      <PageButtons p={p} />
    </div>
  );
}

function SpeedCtl({ p }: { p: Props }) {
  const id = useId();
  return (
    <div className="sp-ctl">
      <label className="sp-lbl" htmlFor={id}>
        Speed
      </label>
      <div className="sp-row">
        <input
          id={id}
          type="range"
          className="range range-xs"
          min={MIN_WPM}
          max={MAX_WPM}
          step={10}
          value={p.wpm}
          aria-valuetext={`${p.wpm} words per minute`}
          onChange={(e) => p.onWpm(Number(e.target.value))}
        />
        <output htmlFor={id} className="sp-val">
          {p.wpm} wpm
        </output>
      </div>
    </div>
  );
}

function SizeCtl({ p }: { p: Props }) {
  return (
    <div className="sp-ctl">
      <span className="sp-lbl" id="sp-l-size">
        Text size
      </span>
      <div className="sp-row" role="group" aria-labelledby="sp-l-size">
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Smaller text"
          disabled={p.sizeIndex <= 0}
          onClick={() => p.onSize(p.sizeIndex - 1)}
        >
          A−
        </button>
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Larger text"
          disabled={p.sizeIndex >= TEXT_SIZES.length - 1}
          onClick={() => p.onSize(p.sizeIndex + 1)}
        >
          A+
        </button>
        <span className="sp-val">
          {Math.round((TEXT_SIZES[p.sizeIndex] ?? 1) * 100)}%
        </span>
      </div>
    </div>
  );
}

function Ctl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sp-ctl">
      <span className="sp-lbl">{label}</span>
      {children}
    </div>
  );
}

/** Bottom settings row; on a phone a compact row plus a bottom sheet. */
export default function SettingsRow(p: Props) {
  return (
    <footer className="sp-dock" data-open={p.sheetOpen}>
      <CompactRow p={p} />
      <div
        className="sp-settings"
        id="sp-settings"
        role="group"
        aria-label="Reading settings"
      >
        <div className="sp-sheet-h">
          <span>Reading settings</span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => p.onSheet(false)}
          >
            Done
          </button>
        </div>
        <SpeedCtl p={p} />
        <SizeCtl p={p} />
        <Ctl label="Theme">
          <Seg
            label="Theme"
            value={p.theme}
            options={THEME_OPTIONS}
            onPick={p.onTheme}
          />
        </Ctl>
        <PaletteSwatches />
        <Ctl label="Spotlight dim">
          <Seg
            label="Spotlight dim"
            value={p.dim}
            options={DIM_OPTIONS}
            onPick={p.onDim}
          />
        </Ctl>
        <div className="sp-ctl sp-ctl--toc">
          <span className="sp-lbl">Book</span>
          <button
            type="button"
            className="btn btn-sm sp-toc-btn"
            onClick={p.onContents}
            aria-haspopup="dialog"
          >
            <IconContents /> Contents
          </button>
        </div>
        <div className="sp-ctl sp-prog">
          <span className="sp-lbl">Progress</span>
          <div className="sp-row">
            <PageButtons p={p} />
            <span className="sp-pr" data-testid="book-progress">
              {progressText(p.progress)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
