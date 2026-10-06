import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ACCENT_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  applyPaletteChoice,
  applyStoredPalette,
  effectiveMode,
  readPaletteChoice,
  savePaletteChoice,
} from './applyPalette';
import { PALETTES } from './palettes';

// Node 25's experimental webstorage shadows jsdom's; use a tiny in-memory one.
function installStorage(): Map<string, string> {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };

  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
  });

  return data;
}

let data: Map<string, string>;

beforeEach(() => {
  data = installStorage();
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-palette');
  document.documentElement.setAttribute('data-theme', 'dark');
});

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('effectiveMode', () => {
  it('is dark only for the dark theme (sepia and light use the light half)', () => {
    expect(effectiveMode('dark')).toBe('dark');
    expect(effectiveMode('light')).toBe('light');
    expect(effectiveMode('sepia')).toBe('light');
    expect(effectiveMode(null)).toBe('light');
  });
});

describe('readPaletteChoice', () => {
  it('defaults to archive with no custom accent when nothing is stored', () => {
    expect(readPaletteChoice()).toEqual({
      palette: 'archive',
      customAccent: null,
    });
  });

  it('reads a saved palette and accent', () => {
    data.set(PALETTE_STORAGE_KEY, 'sage');
    data.set(ACCENT_STORAGE_KEY, '#3a7bd5');

    expect(readPaletteChoice()).toEqual({
      palette: 'sage',
      customAccent: '#3a7bd5',
    });
  });

  it('ignores malformed stored values', () => {
    data.set(PALETTE_STORAGE_KEY, 'neon');
    data.set(ACCENT_STORAGE_KEY, 'not-a-color');

    expect(readPaletteChoice()).toEqual({
      palette: 'archive',
      customAccent: null,
    });
  });
});

describe('savePaletteChoice', () => {
  it('round-trips, and removes the accent when it is cleared', () => {
    savePaletteChoice({ palette: 'rose', customAccent: '#3a7bd5' });
    expect(readPaletteChoice()).toEqual({
      palette: 'rose',
      customAccent: '#3a7bd5',
    });

    savePaletteChoice({ palette: 'rose', customAccent: null });
    expect(data.has(ACCENT_STORAGE_KEY)).toBe(false);
  });
});

describe('applyPaletteChoice', () => {
  it('sets the chosen palette half as inline variables and marks the root', () => {
    const root = document.documentElement;

    applyPaletteChoice(root, { palette: 'slate', customAccent: null }, 'dark');

    expect(root.style.getPropertyValue('--color-bg')).toBe(
      PALETTES.slate.dark['--color-bg'],
    );
    expect(root.getAttribute('data-palette')).toBe('slate');
  });

  it('clears stale variables when switching back to the default palette', () => {
    const root = document.documentElement;

    applyPaletteChoice(root, { palette: 'slate', customAccent: null }, 'dark');
    applyPaletteChoice(
      root,
      { palette: 'archive', customAccent: null },
      'dark',
    );

    // archive IS tokens.css, so no inline override should remain.
    expect(root.style.getPropertyValue('--color-bg')).toBe('');
    expect(root.getAttribute('data-palette')).toBe('archive');
  });

  it('applies a custom accent that clears contrast, and drops one that does not', () => {
    const root = document.documentElement;

    applyPaletteChoice(
      root,
      { palette: 'archive', customAccent: '#ffcc00' },
      'dark',
    );
    expect(root.style.getPropertyValue('--color-accent')).toBe('#ffcc00');

    // Near-background accent fails the 3:1 check, so it is not applied.
    applyPaletteChoice(
      root,
      { palette: 'archive', customAccent: '#1c1813' },
      'dark',
    );
    expect(root.style.getPropertyValue('--color-accent')).toBe('');
  });
});

describe('applyStoredPalette', () => {
  it('uses the dark half under the dark theme and the light half otherwise', () => {
    const root = document.documentElement;
    data.set(PALETTE_STORAGE_KEY, 'slate');

    applyStoredPalette();
    expect(root.style.getPropertyValue('--color-bg')).toBe(
      PALETTES.slate.dark['--color-bg'],
    );

    root.setAttribute('data-theme', 'sepia');
    applyStoredPalette();
    expect(root.style.getPropertyValue('--color-bg')).toBe(
      PALETTES.slate.light['--color-bg'],
    );
  });
});
