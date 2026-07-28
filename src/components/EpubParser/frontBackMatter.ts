/*
  Heuristics for recognizing/discarding the non-content pages that show up
  when parsing real-world EPUBs, in particular the Project Gutenberg
  releases this app ships as sample books (see public/sample-books/ and
  ATTRIBUTION.md).

  EPUB's spine <itemref linear="no"> attribute is the "official" way to mark
  a section as out-of-reading-order (covers, ads, etc.), but Gutenberg's own
  epub generator never sets it - every section in the shipped samples,
  including the cover and license header, is linear="yes" (verified by
  inspecting the .opf files directly). So filtering on
  `Section.linear` (see node_modules/epubjs/lib/section.js) does nothing
  for the books this app actually ships, and we're left with content-based
  heuristics instead.

  Two independent problems show up in practice (verified against all three
  shipped epubs by unzipping them and inspecting the extracted text - see
  fuzz/epub-extract-text.fuzz.js for the DOMParser/jsdom polyfill pattern
  used to load them in a script):

  1. Gutenberg wraps the real book text between two literal marker lines:
       *** START OF THE PROJECT GUTENBERG EBOOK <TITLE> ***
       *** END OF THE PROJECT GUTENBERG EBOOK <TITLE> ***
     (older Gutenberg releases used "THIS" instead of "THE" - both are
     handled here even though none of the 3 shipped books use the "THIS"
     form, since real Gutenberg downloads outside this sample set will).
     Critically, the marker often falls *in the middle* of a page's text
     rather than on a page boundary: epub.js's Section.load() resolves with
     `xml.documentElement` (the whole <html> node, not just <body>), and for
     these books a single spine section can contain the entire license
     header AND the start of the real chapter text concatenated together
     (confirmed: Phaedo's first content section is a single ~72,000
     character page containing the full boilerplate followed immediately by
     "PHAEDO By Plato Translated by Benjamin Jowett..."). So this can't be a
     whole-page skip decision - the boilerplate has to be sliced out of
     whatever page it's found in.

  2. Some pages are real DOM content but are trivially short and carry no
     narrative value - most notably the cover page. Gutenberg's cover wrapper
     document has an empty <body> (just an <img>) but a literal
     `<title>"Cover"</title>` in its <head>; since extractText() reads
     .textContent off the whole documentElement (not just .body), that
     title text leaks through as the page's entire "content": the literal
     7-character string `"Cover"`. The same shape (a handful of words, no
     real sentence) also turns up as leftover residue after stripping a
     Gutenberg marker from a page that was otherwise 100% boilerplate (e.g.
     Phaedo's final page is just "Phaedo, by Plato" once the trailing
     license footer is cut off after the END marker).
*/

// Matches "*** START OF THE PROJECT GUTENBERG EBOOK <anything up to the
// closing asterisks> ***", case-insensitively, tolerating the older "THIS"
// wording. `[^*]*` keeps the match from accidentally swallowing past the
// next unrelated "***" horizontal rule some Gutenberg texts use elsewhere.
const START_MARKER_RE =
  /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
const END_MARKER_RE =
  /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;

/**
 * Cuts Project Gutenberg's boilerplate markers (and everything outside
 * them) out of a page's already-whitespace-normalized text:
 *   - text before/including a "*** START OF ... ***" marker is dropped
 *     (title page + license header)
 *   - text after/including a "*** END OF ... ***" marker is dropped
 *     (license footer, transcriber's notes)
 *
 * Pages with neither marker (the overwhelming majority - every real
 * chapter) pass through unchanged. Safe to call on any page's text,
 * Gutenberg-sourced or not - it's a no-op when the markers aren't present.
 */
export function stripGutenbergBoilerplate(pageText: string): string {
  let result = pageText;

  const startMatch = START_MARKER_RE.exec(result);
  if (startMatch) {
    result = result.slice(startMatch.index + startMatch[0].length);
  }

  const endMatch = END_MARKER_RE.exec(result);
  if (endMatch) {
    result = result.slice(0, endMatch.index);
  }

  return result.trim();
}

// "Very short" is intentionally small: real EPUB "pages" in this app are
// whole spine sections (roughly a chapter), so genuine narrative content -
// even a single line of dialogue or a short poem - is almost always well
// past a sentence's worth of characters and words. Thresholds this low only
// catch section/label-only pages (a bare "Cover", "Contents", "Index") and
// deliberately let real short content through.
const SHORT_PAGE_MAX_CHARS = 30;
const SHORT_PAGE_MAX_WORDS = 3;

// A page that still mentions "Gutenberg" after stripGutenbergBoilerplate()
// has already run is leftover boilerplate residue (a running title like
// "The Project Gutenberg eBook of Meditations, by Marcus Aurelius" that sat
// next to a marker on the same page) - real narrative text from a public
// domain classic has no legitimate reason to say "Gutenberg". Capped at a
// generous length so this can never eat a real, merely-mentions-Gutenberg
// page in some hypothetical future book.
const GUTENBERG_KEYWORD_RE = /gutenberg/i;
const GUTENBERG_RESIDUE_MAX_CHARS = 250;

/**
 * Decides whether an already-normalized page of text is front/back matter
 * that should never be shown in the reader, rather than real content.
 * Conservative by design: it only drops pages that are empty, a handful of
 * words long, or an obvious Gutenberg boilerplate leftover - never a real
 * (even short) piece of narrative/dialogue.
 */
export function isSkippableFrontOrBackMatter(pageText: string): boolean {
  const text = pageText.trim();

  if (text.length === 0) {
    return true;
  }

  if (
    text.length < GUTENBERG_RESIDUE_MAX_CHARS &&
    GUTENBERG_KEYWORD_RE.test(text)
  ) {
    return true;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (text.length < SHORT_PAGE_MAX_CHARS && wordCount <= SHORT_PAGE_MAX_WORDS) {
    return true;
  }

  return false;
}
