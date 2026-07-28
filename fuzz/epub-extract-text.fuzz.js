// Fuzz target for EpubParser's extractText(), the boundary where text
// pulled from a user-uploaded EPUB's chapter markup (untrusted content)
// gets turned into plain text for the RSVP reader. jazzer's target loader
// expects a plain .js file, but this transitively imports the real
// TypeScript source (extractText.ts) - run with Node's native type
// stripping active for the whole process:
//   NODE_OPTIONS=--experimental-strip-types \
//     pnpm exec jazzer fuzz/epub-extract-text.fuzz.js -- -max_total_time=30
//
// extractText uses browser DOMParser/Element APIs that don't exist in
// plain Node - jsdom (already a devDependency for vitest's test
// environment) provides them here.
import { JSDOM } from 'jsdom';
import extractText from '../src/components/EpubParser/extractText.ts';

const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

export function fuzz(data) {
  // Fuzz both call shapes extractText actually receives: a raw string (the
  // fallback path for spine items epub.js's archive layer doesn't parse
  // itself) and a real parsed Element (the normal path).
  const text = data.toString('utf-8');

  extractText(text);

  const el = dom.window.document.createElement('div');
  el.innerHTML = text;
  extractText(el);
}
