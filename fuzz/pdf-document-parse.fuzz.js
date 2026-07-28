// Fuzz target for the actual PDF-parsing boundary PDFParser.tsx relies on:
// PDFJS.getDocument(bytes).promise, fed directly with arbitrary
// (near-certainly malformed) bytes standing in for an uploaded ".pdf" file.
// This isn't fuzzing our own parsing logic (pdfjs-dist does that) - it's
// confirming the *contract* PDFParser.tsx's error handling is built on:
// that malformed input always settles (resolve or reject) rather than
// hanging or crashing the process, since PDFParser has no timeout of its
// own around this call. Run:
//   NODE_OPTIONS=--experimental-strip-types pnpm exec jazzer \
//     fuzz/pdf-document-parse.fuzz.js --disableBugDetectors=prototype-pollution \
//     -- -max_total_time=60
//
// prototype-pollution detection is disabled here: pdfjs-dist's legacy
// build patches Array.prototype (adding a `group` polyfill) at module-load
// time, before any fuzzed input is processed - jazzer's detector flags
// that as pollution on the very first (empty) run. It's the library's own
// load-time behavior, not something the fuzzed bytes trigger.
//
// The browser-oriented "pdfjs-dist" entry (what PDFParser.tsx imports)
// resolves to a different shape in plain Node (no `window`) - pdfjs-dist's
// own docs point Node consumers at the "legacy" build instead, which also
// runs happily without a real Worker (falls back to an in-process "fake
// worker"), avoiding the workerSrc setup PDFParser.tsx needs in a browser.
import * as PDFJS from 'pdfjs-dist/legacy/build/pdf.js';

export async function fuzz(data) {
  try {
    const doc = await PDFJS.getDocument({ data: new Uint8Array(data) }).promise;
    await doc.destroy();
  } catch {
    // A rejection here is completely expected for arbitrary bytes - that's
    // exactly the contract PDFParser.tsx's .catch() handler is built on.
    // Only a hang or an uncaught crash would be a real finding.
  }
}
