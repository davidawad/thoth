// The playback head's typeface is a setting. Default: Atkinson Hyperlegible
// (designed for character distinction - see the legibility notes in Settings).
// The choice is saved in localStorage and applied as data-head-font on <html>;
// styles/tokens.css maps each id to a font stack (--font-head).

export interface HeadFontOption {
  id: string;
  label: string;
}

export const HEAD_FONTS: readonly HeadFontOption[] = [
  { id: 'atkinson-hyperlegible', label: 'Atkinson Hyperlegible (default)' },
  { id: 'verdana', label: 'Verdana' },
  { id: 'inter', label: 'Inter' },
  { id: 'source-serif-4', label: 'Source Serif 4' },
  { id: 'georgia', label: 'Georgia' },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono' },
];

export const DEFAULT_HEAD_FONT = 'atkinson-hyperlegible';
export const HEAD_FONT_STORAGE_KEY = 'thoth-head-font';
export const HEAD_FONT_ATTRIBUTE = 'data-head-font';

/** The id if it names a known font, else the default (malformed storage never throws). */
export function parseHeadFont(value: string | null | undefined): string {
  return HEAD_FONTS.some((font) => font.id === value)
    ? (value as string)
    : DEFAULT_HEAD_FONT;
}

export function readHeadFont(): string {
  try {
    return parseHeadFont(window.localStorage.getItem(HEAD_FONT_STORAGE_KEY));
  } catch {
    return DEFAULT_HEAD_FONT;
  }
}

export function saveHeadFont(id: string): void {
  try {
    window.localStorage.setItem(HEAD_FONT_STORAGE_KEY, parseHeadFont(id));
  } catch {
    // storage unavailable: the choice still applies for this session.
  }
}

export function applyHeadFont(id: string, root: HTMLElement): void {
  root.setAttribute(HEAD_FONT_ATTRIBUTE, parseHeadFont(id));
}

/** Re-applies the saved choice to the page. */
export function applyStoredHeadFont(): string {
  const id = readHeadFont();

  applyHeadFont(id, document.documentElement);

  return id;
}
