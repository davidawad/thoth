/*
  Paragraph-preserving text extraction for an EPUB spine section (the
  existing extractText() flattens everything to one run of text; the reader
  wants paragraph breaks so pages end at paragraph boundaries and the
  editor shows readable text). Reads <body> only, so the <head><title> never
  leaks in as "content" (the old Gutenberg "Cover" problem).
*/

const BLOCK_SELECTOR =
  'p,div,h1,h2,h3,h4,h5,h6,li,blockquote,pre,tr,br,section,article,dt,dd,figcaption';
const HEADING_SELECTOR = 'h1,h2,h3,h4';
const SEP = '\u0001';

export interface ExtractedSection {
  text: string;
  /** first heading in the section, if any */
  heading: string;
}

const collapse = (s: string): string => s.replace(/\s+/g, ' ').trim();

export function extractBlocks(
  contents: Element | string | null | undefined,
): ExtractedSection {
  if (!contents) {
    return { text: '', heading: '' };
  }
  let root: Element | null;
  if (typeof contents === 'string') {
    const doc = new DOMParser().parseFromString(contents, 'text/html');
    root = doc.body;
  } else {
    root =
      contents.querySelector('body') ??
      (contents.localName === 'body' ? contents : contents);
  }
  if (!root) {
    return { text: '', heading: '' };
  }

  const headingEl = root.querySelector(HEADING_SELECTOR);
  const heading = headingEl ? collapse(headingEl.textContent ?? '') : '';

  // Drop non-reading content before reading text.
  root.querySelectorAll('script,style,nav,svg,img').forEach((n) => n.remove());

  // Mark block boundaries, then collapse source whitespace around them.
  const doc = root.ownerDocument;
  root.querySelectorAll(BLOCK_SELECTOR).forEach((el) => {
    if (el.localName === 'br') {
      el.parentNode?.insertBefore(doc.createTextNode(SEP), el.nextSibling);
    } else {
      el.appendChild(doc.createTextNode(SEP));
    }
  });
  const raw = root.textContent ?? '';
  const text = raw.split(SEP).map(collapse).filter(Boolean).join('\n\n');
  return { text, heading };
}
