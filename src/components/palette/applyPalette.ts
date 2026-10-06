import {
  PALETTE_VARIABLES,
  resolvePaletteCssVars,
  type ColorMode,
} from './palettes';
import {
  DEFAULT_PALETTE,
  hexColorSchema,
  paletteSchema,
  type Palette,
} from './types';

export const PALETTE_STORAGE_KEY = 'thoth-palette';
export const ACCENT_STORAGE_KEY = 'thoth-custom-accent';

export interface PaletteChoice {
  palette: Palette;
  customAccent: string | null;
}

// Thoth's themes are explicit (light / dark / sepia), set as data-theme on
// <html>. A palette defines dark and light halves, so sepia (a light theme)
// uses the light half when a non-default palette is chosen.
export function effectiveMode(theme: string | null | undefined): ColorMode {
  return theme === 'dark' ? 'dark' : 'light';
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// The saved choice; anything missing or malformed falls back to the default
// palette / no custom accent rather than throwing.
export function readPaletteChoice(): PaletteChoice {
  const palette = paletteSchema.safeParse(readStored(PALETTE_STORAGE_KEY));
  const accent = hexColorSchema.safeParse(readStored(ACCENT_STORAGE_KEY));

  return {
    palette: palette.success ? palette.data : DEFAULT_PALETTE,
    customAccent: accent.success ? accent.data : null,
  };
}

export function savePaletteChoice(choice: PaletteChoice): void {
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, choice.palette);

    if (choice.customAccent === null) {
      window.localStorage.removeItem(ACCENT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, choice.customAccent);
    }
  } catch {
    // localStorage unavailable (private browsing, disabled): the choice still
    // applies for this session, it just won't persist.
  }
}

// Sets the palette as INLINE variables on <html> (inline outranks every
// selector in tokens.css), first clearing whatever a previous choice set so
// switching back to the default leaves the stylesheet in charge.
export function applyPaletteChoice(
  root: HTMLElement,
  choice: PaletteChoice,
  mode: ColorMode,
): void {
  for (const variable of PALETTE_VARIABLES) {
    root.style.removeProperty(variable);
  }

  const vars = resolvePaletteCssVars(choice.palette, mode, choice.customAccent);

  for (const [variable, value] of Object.entries(vars)) {
    root.style.setProperty(variable, value);
  }

  root.setAttribute('data-palette', choice.palette);
}

// Re-reads the saved choice and applies it for the theme currently on screen.
// Call after a palette change AND after a theme change (the mode can flip).
export function applyStoredPalette(): PaletteChoice {
  const choice = readPaletteChoice();
  const root = document.documentElement;

  applyPaletteChoice(
    root,
    choice,
    effectiveMode(root.getAttribute('data-theme')),
  );

  return choice;
}
