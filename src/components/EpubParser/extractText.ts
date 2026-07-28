/*
  Pull plain text out of a parsed epub.js section.

  In the normal case `section.load()` (see EpubParser's openBook) resolves
  with `xml.documentElement` - a real DOM Element that epub.js already
  parsed via DOMParser. `.textContent` on that element walks the whole
  subtree and concatenates text nodes, which strips every tag for free -
  no manual HTML stripping needed.

  Some spine item extensions aren't recognized by epub.js's archive/request
  layer (see node_modules/epubjs/lib/archive.js handleResponse) and come
  back as a raw markup string instead of a parsed Element. For that case we
  fall back to parsing the string ourselves and stripping tags by reading
  `.textContent` off the parsed body.

  Pulled into its own file (not inline in EpubParser.tsx) so it can be
  fuzz-tested directly (fuzz/epub-extract-text.fuzz.ts) without pulling in
  JSX/React - this function takes untrusted content from uploaded EPUB
  files and must never throw regardless of what's inside them.
*/
export default function extractText(
  contents: Element | string | null | undefined,
): string {
  if (!contents) {
    return '';
  }

  if (typeof contents !== 'string') {
    return contents.textContent || '';
  }

  const parsed = new DOMParser().parseFromString(contents, 'text/html');
  return (parsed.body && parsed.body.textContent) || '';
}
