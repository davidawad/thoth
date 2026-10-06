/**
 * Named color palettes as pure data, keyed by the exact CSS custom
 * properties tokens.css defines. `archive` mirrors tokens.css's own values
 * (and is the default), so it needs no overrides at all. See tokens.css's
 * header for how these are applied and why.
 *
 * Every preset is defined for BOTH modes and is contrast-tested in
 * palettes.test.ts against the thresholds in contrast.ts.
 */
import type { Palette } from './types';
import { NON_TEXT_CONTRAST_MIN, contrastRatio, readableOn } from './contrast';

export type ColorMode = 'light' | 'dark';

export interface PaletteTokens {
  readonly '--color-bg': string;
  readonly '--color-bg-elevated': string;
  readonly '--color-bg-elevated-2': string;
  readonly '--color-fg': string;
  readonly '--color-fg-muted': string;
  readonly '--color-border': string;
  readonly '--color-border-strong': string;
  readonly '--color-accent': string;
  readonly '--color-accent-contrast': string;
  readonly '--color-focus-ring': string;
  readonly '--color-success': string;
  readonly '--color-error': string;
  readonly '--color-surface-highlight': string;
  readonly '--color-surface-highlight-fg': string;
  readonly '--color-surface-highlight-fg-muted': string;
  readonly '--color-surface-highlight-border': string;
}

export interface PaletteDefinition {
  readonly label: string;
  readonly description: string;
  readonly dark: PaletteTokens;
  readonly light: PaletteTokens;
}

export const PALETTES: Readonly<Record<Palette, PaletteDefinition>> = {
  archive: {
    label: 'Archive',
    description: 'Warm parchment and gold — the original look.',
    dark: {
      '--color-bg': '#1b1712',
      '--color-bg-elevated': '#241b14',
      '--color-bg-elevated-2': '#2c2119',
      '--color-fg': '#ece1c9',
      '--color-fg-muted': '#b9aa8c',
      '--color-border': 'rgba(237, 227, 205, 0.09)',
      '--color-border-strong': '#8a7a63',
      '--color-accent': '#b4903f',
      '--color-accent-contrast': '#1b1712',
      '--color-focus-ring': '#d8be85',
      '--color-success': '#8cb08a',
      '--color-error': '#e0664a',
      '--color-surface-highlight': '#241b14',
      '--color-surface-highlight-fg': '#ece1c9',
      '--color-surface-highlight-fg-muted': '#b9aa8c',
      '--color-surface-highlight-border': 'rgba(237, 227, 205, 0.09)',
    },
    light: {
      '--color-bg': '#f8f0dd',
      '--color-bg-elevated': '#ece0c6',
      '--color-bg-elevated-2': '#e3d5af',
      '--color-fg': '#2a1e12',
      '--color-fg-muted': '#5a4b37',
      '--color-border': 'rgba(42, 30, 18, 0.12)',
      '--color-border-strong': '#8a7a63',
      '--color-accent': '#7a5a1a',
      '--color-accent-contrast': '#f8f0dd',
      '--color-focus-ring': '#7a5a1a',
      '--color-success': '#3f5940',
      '--color-error': '#7a2c1c',
      '--color-surface-highlight': '#fffdf6',
      '--color-surface-highlight-fg': '#2a1e12',
      '--color-surface-highlight-fg-muted': '#5a4b37',
      '--color-surface-highlight-border': 'rgba(42, 30, 18, 0.12)',
    },
  },
  slate: {
    label: 'Slate',
    description: 'Cool ink-blue and steel.',
    dark: {
      '--color-bg': '#11161d',
      '--color-bg-elevated': '#18202a',
      '--color-bg-elevated-2': '#202a36',
      '--color-fg': '#e3e9f0',
      '--color-fg-muted': '#a5b3c4',
      '--color-border': 'rgba(200, 215, 235, 0.1)',
      '--color-border-strong': '#6f8197',
      '--color-accent': '#6fa3d8',
      '--color-accent-contrast': '#0e141b',
      '--color-focus-ring': '#a9ccf0',
      '--color-success': '#7fc08f',
      '--color-error': '#ec7a68',
      '--color-surface-highlight': '#18202a',
      '--color-surface-highlight-fg': '#e3e9f0',
      '--color-surface-highlight-fg-muted': '#a5b3c4',
      '--color-surface-highlight-border': 'rgba(200, 215, 235, 0.1)',
    },
    light: {
      '--color-bg': '#eef2f7',
      '--color-bg-elevated': '#e0e7f0',
      '--color-bg-elevated-2': '#d2dce9',
      '--color-fg': '#14202e',
      '--color-fg-muted': '#43546a',
      '--color-border': 'rgba(20, 32, 46, 0.12)',
      '--color-border-strong': '#6b7f96',
      '--color-accent': '#1f5a94',
      '--color-accent-contrast': '#eef2f7',
      '--color-focus-ring': '#1f5a94',
      '--color-success': '#246b3a',
      '--color-error': '#a3281a',
      '--color-surface-highlight': '#fbfdff',
      '--color-surface-highlight-fg': '#14202e',
      '--color-surface-highlight-fg-muted': '#43546a',
      '--color-surface-highlight-border': 'rgba(20, 32, 46, 0.12)',
    },
  },
  sage: {
    label: 'Sage',
    description: 'Quiet moss and leaf green.',
    dark: {
      '--color-bg': '#141a15',
      '--color-bg-elevated': '#1b231c',
      '--color-bg-elevated-2': '#232d24',
      '--color-fg': '#e2eadb',
      '--color-fg-muted': '#a9b8a2',
      '--color-border': 'rgba(210, 230, 200, 0.1)',
      '--color-border-strong': '#758a72',
      '--color-accent': '#8fb572',
      '--color-accent-contrast': '#101610',
      '--color-focus-ring': '#b9d6a1',
      '--color-success': '#8fcf94',
      '--color-error': '#e87c62',
      '--color-surface-highlight': '#1b231c',
      '--color-surface-highlight-fg': '#e2eadb',
      '--color-surface-highlight-fg-muted': '#a9b8a2',
      '--color-surface-highlight-border': 'rgba(210, 230, 200, 0.1)',
    },
    light: {
      '--color-bg': '#f1f4e8',
      '--color-bg-elevated': '#e3e9d3',
      '--color-bg-elevated-2': '#d4ddbc',
      '--color-fg': '#1a2417',
      '--color-fg-muted': '#475540',
      '--color-border': 'rgba(26, 36, 23, 0.12)',
      '--color-border-strong': '#76866e',
      '--color-accent': '#3f6b2a',
      '--color-accent-contrast': '#f1f4e8',
      '--color-focus-ring': '#3f6b2a',
      '--color-success': '#2f6a36',
      '--color-error': '#8f2f1c',
      '--color-surface-highlight': '#fbfdf5',
      '--color-surface-highlight-fg': '#1a2417',
      '--color-surface-highlight-fg-muted': '#475540',
      '--color-surface-highlight-border': 'rgba(26, 36, 23, 0.12)',
    },
  },
  rose: {
    label: 'Rose',
    description: 'Dusky rose and plum.',
    dark: {
      '--color-bg': '#1a1317',
      '--color-bg-elevated': '#241a20',
      '--color-bg-elevated-2': '#2e2129',
      '--color-fg': '#f0dfe5',
      '--color-fg-muted': '#bfa6b0',
      '--color-border': 'rgba(240, 215, 225, 0.1)',
      '--color-border-strong': '#8d7480',
      '--color-accent': '#d98aa8',
      '--color-accent-contrast': '#1a1317',
      '--color-focus-ring': '#eab5c8',
      '--color-success': '#8cc79b',
      '--color-error': '#f0806a',
      '--color-surface-highlight': '#241a20',
      '--color-surface-highlight-fg': '#f0dfe5',
      '--color-surface-highlight-fg-muted': '#bfa6b0',
      '--color-surface-highlight-border': 'rgba(240, 215, 225, 0.1)',
    },
    light: {
      '--color-bg': '#faf0f3',
      '--color-bg-elevated': '#f0dde4',
      '--color-bg-elevated-2': '#e6c9d4',
      '--color-fg': '#2a1520',
      '--color-fg-muted': '#5c4350',
      '--color-border': 'rgba(42, 21, 32, 0.12)',
      '--color-border-strong': '#8c7380',
      '--color-accent': '#8e2f58',
      '--color-accent-contrast': '#faf0f3',
      '--color-focus-ring': '#8e2f58',
      '--color-success': '#2f6a3c',
      '--color-error': '#a02a1c',
      '--color-surface-highlight': '#fffafc',
      '--color-surface-highlight-fg': '#2a1520',
      '--color-surface-highlight-fg-muted': '#5c4350',
      '--color-surface-highlight-border': 'rgba(42, 21, 32, 0.12)',
    },
  },
  'high-contrast': {
    label: 'High contrast',
    description: 'Pure black/white with saturated accents, 7:1+ text.',
    dark: {
      '--color-bg': '#000000',
      '--color-bg-elevated': '#0d0d0d',
      '--color-bg-elevated-2': '#1a1a1a',
      '--color-fg': '#ffffff',
      '--color-fg-muted': '#e0e0e0',
      '--color-border': 'rgba(255, 255, 255, 0.25)',
      '--color-border-strong': '#bdbdbd',
      '--color-accent': '#ffd54a',
      '--color-accent-contrast': '#000000',
      '--color-focus-ring': '#6cc4ff',
      '--color-success': '#7dff9b',
      '--color-error': '#ff8a7a',
      '--color-surface-highlight': '#0d0d0d',
      '--color-surface-highlight-fg': '#ffffff',
      '--color-surface-highlight-fg-muted': '#e0e0e0',
      '--color-surface-highlight-border': 'rgba(255, 255, 255, 0.25)',
    },
    light: {
      '--color-bg': '#ffffff',
      '--color-bg-elevated': '#f2f2f2',
      '--color-bg-elevated-2': '#e6e6e6',
      '--color-fg': '#000000',
      '--color-fg-muted': '#2b2b2b',
      '--color-border': 'rgba(0, 0, 0, 0.3)',
      '--color-border-strong': '#595959',
      '--color-accent': '#0b3d91',
      '--color-accent-contrast': '#ffffff',
      '--color-focus-ring': '#0b3d91',
      '--color-success': '#0a5a1e',
      '--color-error': '#8a0f00',
      '--color-surface-highlight': '#ffffff',
      '--color-surface-highlight-fg': '#000000',
      '--color-surface-highlight-fg-muted': '#2b2b2b',
      '--color-surface-highlight-border': 'rgba(0, 0, 0, 0.3)',
    },
  },
};

/** Every CSS variable a palette/custom accent can set — used to clear stale inline values. */
export const PALETTE_VARIABLES = Object.keys(
  PALETTES.archive.dark,
) as readonly (keyof PaletteTokens)[];

export type CssVars = Readonly<Partial<Record<keyof PaletteTokens, string>>>;

// ---------------------------------------------------------------------------
// Custom accent
// ---------------------------------------------------------------------------

export interface AccentCheck {
  readonly ok: boolean;
  /** Contrast of the accent against the mode's background, or null for an invalid hex. */
  readonly ratio: number | null;
  /** Black or white, whichever is readable on the accent (for button text). */
  readonly contrastColor: string | null;
}

/** Checks a candidate accent against `mode`'s background in `palette` (WCAG 1.4.11, 3:1). */
export const checkAccent = (
  accent: string,
  palette: Palette,
  mode: ColorMode,
): AccentCheck => {
  const ratio = contrastRatio(accent, PALETTES[palette][mode]['--color-bg']);
  return {
    ok: ratio !== null && ratio >= NON_TEXT_CONTRAST_MIN,
    ratio,
    contrastColor: ratio === null ? null : readableOn(accent),
  };
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * The inline CSS variables to set on <html> for a palette + effective mode +
 * optional custom accent. `archive` with no custom accent resolves to {} —
 * tokens.css already is that palette, so the stylesheet governs untouched.
 * A custom accent that fails 3:1 against this mode's background is dropped
 * here (not just in the UI), so stale or hand-edited data can't wreck
 * readability.
 */
export const resolvePaletteCssVars = (
  palette: Palette,
  mode: ColorMode,
  customAccent: string | null,
): CssVars => {
  const base: CssVars = palette === 'archive' ? {} : PALETTES[palette][mode];
  if (customAccent === null) return base;
  const check = checkAccent(customAccent, palette, mode);
  if (!check.ok || check.contrastColor === null) return base;
  return {
    ...base,
    '--color-accent': customAccent,
    '--color-accent-contrast': check.contrastColor,
    '--color-focus-ring': customAccent,
  };
};
