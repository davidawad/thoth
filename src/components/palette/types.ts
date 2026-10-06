import { z } from 'zod';

// The named palettes (same set as Seshat). `archive` is the default and equals
// styles/tokens.css, so choosing it needs no inline overrides.
export const paletteSchema = z.enum([
  'archive',
  'slate',
  'sage',
  'rose',
  'high-contrast',
]);
export type Palette = z.infer<typeof paletteSchema>;
export const DEFAULT_PALETTE: Palette = 'archive';

// Custom accent, stored as lowercase #rrggbb (or absent).
export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/);
