/*
  Pure text handling for PDFs (pdfjs gives us lines per page; everything here
  works on plain string arrays so it is testable without a PDF).
*/
import type { Chapter } from './bookModel';
import { countWords } from './bookModel';

const EDGE_LINES = 2;

/** Normalises a running header/footer so "Page 12" and "Page 13" compare equal. */
export function furnitureKey(line: string): string {
  return line.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
}

/**
 * Removes running headers/footers and bare page numbers: a line within the
 * first/last EDGE_LINES of a page whose digit-normalised form repeats on at
 * least max(3, 25%) of pages is page furniture. A line that is only a page
 * number ("12", "- 12 -", "xii") at a page edge is always dropped.
 */
export function stripPageFurniture(pages: readonly string[][]): string[][] {
  const counts = new Map<string, number>();
  const edgeKeys = (lines: readonly string[]): Set<string> => {
    const keys = new Set<string>();
    const edge = [...lines.slice(0, EDGE_LINES), ...lines.slice(-EDGE_LINES)];
    for (const l of edge) {
      const k = furnitureKey(l);
      if (k) {
        keys.add(k);
      }
    }
    return keys;
  };
  for (const lines of pages) {
    for (const k of edgeKeys(lines)) {
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.25));
  const furniture = new Set(
    [...counts.entries()].filter(([, n]) => n >= threshold).map(([k]) => k),
  );
  const pageNumberOnly = /^[\s\-–—.]*(\d{1,4}|[ivxlcdm]{1,7})[\s\-–—.]*$/i;

  return pages.map((lines) => {
    const out = [...lines];
    const isEdge = (i: number): boolean =>
      i < EDGE_LINES || i >= out.length - EDGE_LINES;
    return out.filter((l, i) => {
      if (!l.trim()) {
        return false;
      }
      if (isEdge(i) && pageNumberOnly.test(l)) {
        return false;
      }
      return !(isEdge(i) && furniture.has(furnitureKey(l)));
    });
  });
}

/**
 * Joins a page's lines into paragraphs. A line ending in a hyphen glues to the
 * next ("recog-" + "nition" -> "recognition"); a short line that ends a
 * sentence, or one followed by an indented/capitalised start after a full
 * stop, ends the paragraph.
 */
export function linesToText(lines: readonly string[]): string {
  const paras: string[] = [];
  let cur = '';
  const widths = lines.map((l) => l.length);
  const max = Math.max(0, ...widths);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) {
      return;
    }
    if (cur.endsWith('-') && /^[a-z]/.test(t)) {
      cur = cur.slice(0, -1) + t;
    } else {
      cur = cur ? cur + ' ' + t : t;
    }
    const next = lines[i + 1];
    const shortEnd = t.length < max * 0.6 && /[.!?:"”’)]$/.test(t);
    if (shortEnd || next === undefined) {
      paras.push(cur);
      cur = '';
    }
  });
  if (cur) {
    paras.push(cur);
  }
  return paras.join('\n\n');
}

export interface OutlineEntry {
  title: string;
  /** 0-based page index */
  page: number;
}

export const PDF_GROUP_PAGES = 20;

const joinPages = (
  pageTexts: readonly string[],
  skip: readonly boolean[],
  from: number,
  to: number,
): string =>
  pageTexts
    .slice(from, to)
    .filter((t, i) => !skip[from + i] && t.trim().length > 0)
    .join('\n\n');

function outlineStarts(
  outline: readonly OutlineEntry[],
  pageCount: number,
): Map<number, string> {
  const starts = new Map<number, string>();
  for (const o of outline) {
    const valid = o.page >= 0 && o.page < pageCount && o.title.trim();
    if (valid && !starts.has(o.page)) {
      starts.set(o.page, o.title.replace(/\s+/g, ' ').trim());
    }
  }
  return starts;
}

/**
 * Chapters from page texts: by outline entries when there are any, else
 * fixed groups of PDF_GROUP_PAGES pages. `skip[i]` marks a page dropped as
 * front/back matter. Chapters with no text are omitted.
 */
export function buildPdfChapters(
  pageTexts: readonly string[],
  skip: readonly boolean[],
  outline: readonly OutlineEntry[],
): Chapter[] {
  const n = pageTexts.length;
  const ranges: { title: string; from: number; to: number }[] = [];
  const starts = outlineStarts(outline, n);
  const sorted = [...starts.keys()].sort((a, b) => a - b);

  if (sorted.length > 0) {
    if ((sorted[0] ?? 0) > 0) {
      ranges.push({ title: 'Opening', from: 0, to: sorted[0] ?? 0 });
    }
    sorted.forEach((from, i) => {
      ranges.push({
        title: starts.get(from) ?? '',
        from,
        to: sorted[i + 1] ?? n,
      });
    });
  } else {
    for (let from = 0; from < n; from += PDF_GROUP_PAGES) {
      const to = Math.min(from + PDF_GROUP_PAGES, n);
      ranges.push({
        title: from + 1 === to ? `Page ${to}` : `Pages ${from + 1}–${to}`,
        from,
        to,
      });
    }
  }
  return ranges
    .map((r) => ({
      title: r.title,
      text: joinPages(pageTexts, skip, r.from, r.to),
    }))
    .filter((c) => countWords(c.text) > 0);
}
