/**
 * WCAG 2.2 contrast math — pure, no DOM. Relative luminance and contrast
 * ratio follow https://www.w3.org/TR/WCAG22/#dfn-relative-luminance and
 * #dfn-contrast-ratio; the thresholds are the ones tokens.css documents.
 */

/** Body-text pairs (WCAG 1.4.3 AA). */
export const TEXT_CONTRAST_MIN = 4.5;
/** Interactive-component boundaries, focus ring, accent (WCAG 1.4.11). */
export const NON_TEXT_CONTRAST_MIN = 3;

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalizes `#abc`/`abc`/`#AABBCC` to lowercase `#rrggbb`, or null when not a hex color. */
export const normalizeHex = (input: string): string | null => {
  const match = HEX_PATTERN.exec(input.trim());
  if (match === null) return null;
  const digits = (match[1] ?? '').toLowerCase();
  const full =
    digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits;
  return `#${full}`;
};

export type Rgb = readonly [number, number, number];

/** Parses a (normalizable) hex color to 0-255 channels, or null. */
export const parseHex = (input: string): Rgb | null => {
  const hex = normalizeHex(input);
  if (hex === null) return null;
  const channel = (offset: number): number =>
    Number.parseInt(hex.slice(offset, offset + 2), 16);
  return [channel(1), channel(3), channel(5)];
};

const linearize = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ([r, g, b]: Rgb): number =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

/** Contrast ratio (1..21) between two hex colors, or null if either is invalid. */
export const contrastRatio = (a: string, b: string): number | null => {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (rgbA === null || rgbB === null) return null;
  const [la, lb] = [relativeLuminance(rgbA), relativeLuminance(rgbB)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const BLACK = '#000000';
const WHITE = '#ffffff';

/** Picks black or white — whichever reads better on `background` (always >= 4.5:1 for one of them). */
export const readableOn = (background: string): string => {
  const black = contrastRatio(background, BLACK) ?? 0;
  const white = contrastRatio(background, WHITE) ?? 0;
  return black >= white ? BLACK : WHITE;
};
