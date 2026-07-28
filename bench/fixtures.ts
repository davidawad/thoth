// Shared text fixtures for benchmarks, sized to mirror what the reader
// actually processes: a paragraph (a settings-panel preview or a short
// pasted snippet) up to a short-story-length upload.
const PARAGRAPH = `The quick brown fox jumps over the lazy dog. Reading rapidly
serial visual presentation reduces the need for saccadic eye movement across
a page, letting a reader focus on a single fixed point while text flows past.
Comprehension depends heavily on word familiarity and sentence complexity.`
  .replace(/\s+/g, ' ')
  .trim();

export const SHORT_TEXT = PARAGRAPH;
export const MEDIUM_TEXT = Array(20).fill(PARAGRAPH).join(' ');
export const LONG_TEXT = Array(200).fill(PARAGRAPH).join(' ');
