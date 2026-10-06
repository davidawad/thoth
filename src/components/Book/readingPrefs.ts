/*
  Reading-view preferences that live in the browser: text size and spotlight
  dim. (Speed, theme and palette keep using the app's own stores.)
*/
export const TEXT_SIZES = [0.9, 1, 1.12, 1.25, 1.4] as const;
export const DEFAULT_TEXT_SIZE_INDEX = 1;
export const DIM_MODES = ['full', 'soft', 'off'] as const;
export type DimMode = (typeof DIM_MODES)[number];

export const LS_TEXT_SIZE = 'thoth.textSize';
export const LS_DIM = 'thoth.spotlightDim';

export function parseTextSizeIndex(raw: string | null): number {
  const n = Number(raw);
  return raw !== null && Number.isInteger(n) && n >= 0 && n < TEXT_SIZES.length
    ? n
    : DEFAULT_TEXT_SIZE_INDEX;
}

export function parseDim(raw: string | null): DimMode {
  return DIM_MODES.find((m) => m === raw) ?? 'full';
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked: the choice still applies for this session
  }
}

export const loadTextSizeIndex = (): number =>
  parseTextSizeIndex(read(LS_TEXT_SIZE));
export const saveTextSizeIndex = (i: number): void =>
  write(LS_TEXT_SIZE, String(i));
export const loadDim = (): DimMode => parseDim(read(LS_DIM));
export const saveDim = (d: DimMode): void => write(LS_DIM, d);
