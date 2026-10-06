/*
  Sizes the pages of the spread from the room available, and estimates how
  many words fit on one page (which drives pagination). The estimate is
  deliberately conservative; the view measures real overflow and tightens it
  (see SpreadReader) so no text is ever clipped.
*/
import { TEXT_SIZES } from './readingPrefs';

export interface StageSize {
  w: number;
  h: number;
}

export interface PageGeometry {
  /** page box, px */
  pw: number;
  ph: number;
  /** body font size, px */
  fs: number;
  /** text area inside the page padding, px */
  textW: number;
  textH: number;
}

export const PAGE_ASPECT = 0.72; // width / height of one page in a spread
export const MAX_PAGE_H = 880;
export const SINGLE_MAX_W = 680;
const PAD_X = 0.085; // of page width, each side
const PAD_TOP = 0.11; // of page height (running head)
const PAD_BOTTOM = 0.1; // of page height (folio)
export const LINE_HEIGHT = 1.62;
const CHAR_EM = 0.4; // average advance of the book face, in em
const WORD_CHARS = 5.9; // average word plus its space

export function pageGeometry(
  stage: StageSize,
  span: 1 | 2,
  textSizeIndex: number,
): PageGeometry {
  const ts = TEXT_SIZES[textSizeIndex] ?? 1;
  const availW = Math.max(stage.w, 200);
  const availH = Math.max(stage.h, 200);
  let pw: number;
  let ph: number;
  if (span === 2) {
    ph = Math.min(availH, availW / 2 / PAGE_ASPECT, MAX_PAGE_H);
    pw = ph * PAGE_ASPECT;
  } else {
    pw = Math.min(availW, SINGLE_MAX_W);
    ph = Math.min(availH, MAX_PAGE_H);
  }
  const fs = Math.min(Math.max(pw * 0.04, 15), 24) * ts;
  return {
    pw: Math.floor(pw),
    ph: Math.floor(ph),
    fs: Math.round(fs * 10) / 10,
    textW: pw * (1 - 2 * PAD_X),
    textH: ph * (1 - PAD_TOP - PAD_BOTTOM),
  };
}

export const PAGE_PADDING = { x: PAD_X, top: PAD_TOP, bottom: PAD_BOTTOM };

/** Words per page for the geometry; `fit` (0..1] is the learned safety factor. */
export function wordsPerPage(g: PageGeometry, fit: number): number {
  const lines = Math.max(Math.floor(g.textH / (g.fs * LINE_HEIGHT)), 1);
  const wordsPerLine = g.textW / (g.fs * CHAR_EM) / WORD_CHARS;
  const raw = lines * wordsPerLine * fit;
  // round to 10 so a few px of window resizing doesn't repaginate the book
  return Math.min(Math.max(Math.round(raw / 10) * 10, 30), 420);
}

export const INITIAL_FIT = 0.92;
export const MIN_FIT = 0.3;
