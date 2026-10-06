import { describe, expect, it } from 'vitest';
import { paletteSchema } from './types';
import {
  NON_TEXT_CONTRAST_MIN,
  TEXT_CONTRAST_MIN,
  contrastRatio,
} from './contrast';
import {
  PALETTES,
  PALETTE_VARIABLES,
  checkAccent,
  resolvePaletteCssVars,
  type ColorMode,
} from './palettes';

const MODES: readonly ColorMode[] = ['dark', 'light'];

const ratio = (a: string, b: string): number => contrastRatio(a, b) ?? 0;

describe.each(paletteSchema.options)('palette %s', (name) => {
  describe.each(MODES)('%s mode', (mode) => {
    const t = PALETTES[name][mode];
    const bg = t['--color-bg'];

    it('defines every token as a non-empty value', () => {
      for (const variable of PALETTE_VARIABLES)
        expect(t[variable]).toBeTruthy();
    });

    it.each([
      ['--color-fg', TEXT_CONTRAST_MIN],
      ['--color-fg-muted', TEXT_CONTRAST_MIN],
      ['--color-accent', TEXT_CONTRAST_MIN],
      ['--color-success', TEXT_CONTRAST_MIN],
      ['--color-error', TEXT_CONTRAST_MIN],
      ['--color-border-strong', NON_TEXT_CONTRAST_MIN],
      ['--color-focus-ring', NON_TEXT_CONTRAST_MIN],
    ] as const)('%s on --color-bg is >= %s:1', (variable, min) => {
      expect(ratio(t[variable], bg)).toBeGreaterThanOrEqual(min);
    });

    it('keeps text readable on both elevated surfaces', () => {
      for (const surface of [
        '--color-bg-elevated',
        '--color-bg-elevated-2',
      ] as const) {
        expect(ratio(t['--color-fg'], t[surface])).toBeGreaterThanOrEqual(
          TEXT_CONTRAST_MIN,
        );
        expect(ratio(t['--color-fg-muted'], t[surface])).toBeGreaterThanOrEqual(
          TEXT_CONTRAST_MIN,
        );
      }
    });

    it('keeps text readable on the highlight surface', () => {
      const surface = t['--color-surface-highlight'];
      expect(
        ratio(t['--color-surface-highlight-fg'], surface),
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST_MIN);
      expect(
        ratio(t['--color-surface-highlight-fg-muted'], surface),
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST_MIN);
    });

    it('keeps button text readable on the accent', () => {
      expect(
        ratio(t['--color-accent-contrast'], t['--color-accent']),
      ).toBeGreaterThanOrEqual(TEXT_CONTRAST_MIN);
    });
  });
});

describe('resolvePaletteCssVars', () => {
  it('resolves archive with no custom accent to no overrides', () => {
    expect(resolvePaletteCssVars('archive', 'dark', null)).toEqual({});
    expect(resolvePaletteCssVars('archive', 'light', null)).toEqual({});
  });

  it('resolves a preset to the full token set for the requested mode', () => {
    expect(resolvePaletteCssVars('slate', 'light', null)).toBe(
      PALETTES.slate.light,
    );
    expect(resolvePaletteCssVars('slate', 'dark', null)).toBe(
      PALETTES.slate.dark,
    );
  });

  it('layers a readable custom accent over the preset, with a readable button color', () => {
    const vars = resolvePaletteCssVars('slate', 'dark', '#e07a1f');
    expect(vars['--color-accent']).toBe('#e07a1f');
    expect(vars['--color-focus-ring']).toBe('#e07a1f');
    expect(vars['--color-accent-contrast']).toBe('#000000');
    expect(vars['--color-bg']).toBe(PALETTES.slate.dark['--color-bg']);
  });

  it('applies a custom accent over archive as accent-only overrides', () => {
    expect(
      Object.keys(resolvePaletteCssVars('archive', 'dark', '#e07a1f')).sort(),
    ).toEqual([
      '--color-accent',
      '--color-accent-contrast',
      '--color-focus-ring',
    ]);
  });

  it('drops a custom accent that fails 3:1 in the current mode', () => {
    expect(resolvePaletteCssVars('archive', 'dark', '#201a14')).toEqual({});
    expect(resolvePaletteCssVars('slate', 'light', '#f0f0f0')).toBe(
      PALETTES.slate.light,
    );
  });
});

describe('checkAccent', () => {
  it('reports the ratio and a readable button color', () => {
    const check = checkAccent('#ffd54a', 'archive', 'dark');
    expect(check.ok).toBe(true);
    expect(check.ratio).toBeGreaterThan(3);
    expect(check.contrastColor).toBe('#000000');
  });

  it('refuses low-contrast accents', () => {
    expect(checkAccent('#2a2a2a', 'archive', 'dark').ok).toBe(false);
  });

  it('handles invalid hex', () => {
    expect(checkAccent('zzz', 'archive', 'dark')).toEqual({
      ok: false,
      ratio: null,
      contrastColor: null,
    });
  });
});
