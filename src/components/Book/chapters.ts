/*
  Turns raw per-section text (EPUB spine items) plus a table of contents into
  the Book's chapter list: drops front/back-matter noise, groups spine
  sections under their TOC entry, and merges stray tiny sections.
*/
import type { Chapter } from './bookModel';
import { countWords } from './bookModel';
import {
  isSkippableFrontOrBackMatter,
  stripGutenbergBoilerplate,
  stripTitlePageAndContents,
} from '../EpubParser/frontBackMatter';

export interface RawSection {
  href: string;
  /** paragraph-preserving text (see extractBlocks) */
  text: string;
  /** first heading in the section, if any */
  heading: string;
}

export interface TocEntry {
  label: string;
  href: string;
}

/** Sections shorter than this (with no TOC to anchor them) fold into the previous chapter. */
const TINY_SECTION_WORDS = 80;

const norm = (href: string): string => {
  const noFrag = href.split('#')[0] ?? '';
  let dec = noFrag;
  try {
    dec = decodeURIComponent(noFrag);
  } catch {
    // keep raw
  }
  return dec.replace(/^\.?\//, '').toLowerCase();
};

/** Index of the spine section a TOC href points into, or -1. */
export function spineIndexForHref(
  sections: readonly RawSection[],
  href: string,
): number {
  const target = norm(href);
  if (!target) {
    return -1;
  }
  const exact = sections.findIndex((s) => norm(s.href) === target);
  if (exact >= 0) {
    return exact;
  }
  // TOC and spine hrefs can differ by a directory prefix ("OEBPS/ch1.xhtml" vs "ch1.xhtml").
  return sections.findIndex((s) => {
    const h = norm(s.href);
    return h.endsWith('/' + target) || target.endsWith('/' + h);
  });
}

const cleanTitle = (s: string): string => s.replace(/\s+/g, ' ').trim();

const countJoined = (texts: readonly string[]): number =>
  countWords(texts.join(' '));

const CONTENTS_LABEL = /^(table of )?contents\.?$/i;

/**
 * The title for a spine section that several TOC entries point into. When one
 * of the entries is "Contents", everything before it describes the title-page
 * material that gets stripped (book title, translator, ...), so the chapter
 * takes the first entry after it; otherwise the first entry, as before.
 */
export function pickSectionLabel(labels: readonly string[]): string {
  let afterContents = 0;
  labels.forEach((label, i) => {
    if (CONTENTS_LABEL.test(label.trim())) {
      afterContents = i + 1;
    }
  });

  return labels[afterContents] ?? labels[0] ?? '';
}

function chapterStarts(
  sections: readonly RawSection[],
  toc: readonly TocEntry[],
): Map<number, string> {
  const labelsBySection = new Map<number, string[]>();
  for (const entry of toc) {
    const idx = spineIndexForHref(sections, entry.href);
    if (idx >= 0) {
      labelsBySection.set(idx, [
        ...(labelsBySection.get(idx) ?? []),
        cleanTitle(entry.label),
      ]);
    }
  }

  const starts = new Map<number, string>();
  for (const [idx, labels] of labelsBySection) {
    starts.set(idx, pickSectionLabel(labels).replace(/\.$/, ''));
  }
  return starts;
}

/** One chapter per TOC entry, holding the kept sections up to the next entry. */
function chaptersFromToc(
  texts: readonly string[],
  starts: Map<number, string>,
): Chapter[] {
  const sorted = [...starts.keys()].sort((a, b) => a - b);
  const out: Chapter[] = [];
  const push = (title: string, parts: string[]): void => {
    const text = parts.join('\n\n').trim();
    if (countWords(text) > 0) {
      out.push({ title: title || `Chapter ${out.length + 1}`, text });
    }
  };
  const slice = (from: number, to: number): string[] =>
    texts.slice(from, to).filter(Boolean);

  const lead = slice(0, sorted[0] ?? 0);
  if (countJoined(lead) >= TINY_SECTION_WORDS) {
    push('Opening', lead);
  }
  sorted.forEach((start, n) => {
    push(starts.get(start) ?? '', slice(start, sorted[n + 1] ?? texts.length));
  });
  return out;
}

/** No usable TOC: one chapter per real section, tiny ones fold backwards. */
function chaptersFromSections(
  sections: readonly RawSection[],
  texts: readonly string[],
): Chapter[] {
  const out: Chapter[] = [];
  texts.forEach((text, i) => {
    if (!text) {
      return;
    }
    const prev = out[out.length - 1];
    if (prev && countWords(text) < TINY_SECTION_WORDS) {
      prev.text += '\n\n' + text;
      return;
    }
    out.push({
      title:
        cleanTitle(sections[i]?.heading ?? '') || `Section ${out.length + 1}`,
      text,
    });
  });
  return out;
}

export function buildChapters(
  rawSections: readonly RawSection[],
  toc: readonly TocEntry[],
): Chapter[] {
  // Boilerplate off every section; '' marks a dropped (junk/empty) section.
  const texts = rawSections.map((s) => {
    const t = stripTitlePageAndContents(stripGutenbergBoilerplate(s.text));
    return t.length > 0 && !isSkippableFrontOrBackMatter(t.replace(/\s+/g, ' '))
      ? t
      : '';
  });
  const starts = chapterStarts(rawSections, toc);
  return starts.size > 0
    ? chaptersFromToc(texts, starts)
    : chaptersFromSections(rawSections, texts);
}
