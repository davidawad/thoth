import type { Palette } from './types';
import { NON_TEXT_CONTRAST_MIN, normalizeHex } from './contrast';
import { checkAccent, type ColorMode } from './palettes';

const OTHER_MODE: Record<ColorMode, ColorMode> = {
  light: 'dark',
  dark: 'light',
};

const formatRatio = (ratio: number | null): string =>
  ratio === null ? '—' : `${ratio.toFixed(2)}:1`;

/** The one-line status text (shown in an `<output>`, i.e. role=status) explaining what the custom accent will do. */
export const describeAccent = (
  draft: string,
  settings: { readonly palette: Palette },
  mode: ColorMode,
): { readonly message: string; readonly valid: boolean } => {
  if (draft.trim() === '')
    return { message: 'Using the palette’s own accent.', valid: true };
  const hex = normalizeHex(draft);
  if (hex === null)
    return {
      message: 'Enter a hex color like #3a7bd5 (3 or 6 digits).',
      valid: false,
    };
  const here = checkAccent(hex, settings.palette, mode);
  if (!here.ok) {
    return {
      message: `Not applied: ${hex} is ${formatRatio(here.ratio)} against the ${mode} background; accents need at least ${NON_TEXT_CONTRAST_MIN}:1.`,
      valid: false,
    };
  }
  const other = checkAccent(hex, settings.palette, OTHER_MODE[mode]);
  const otherNote = other.ok
    ? ''
    : ` It is only ${formatRatio(other.ratio)} in ${OTHER_MODE[mode]} mode, so the palette’s own accent is used there.`;
  return {
    message: `${hex} applied: ${formatRatio(here.ratio)} against the ${mode} background; button text is ${here.contrastColor === '#000000' ? 'black' : 'white'}.${otherNote}`,
    valid: true,
  };
};
