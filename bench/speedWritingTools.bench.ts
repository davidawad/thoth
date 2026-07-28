import { bench, describe } from 'vitest';
import nlp from 'compromise';
import SpeedWritingTools from '../src/components/SpeedWritingTools';
import { SHORT_TEXT, MEDIUM_TEXT } from './fixtures';

// Mirrors substituteText's local candidacy-scan pass (compromise tagging +
// analyzeTermForCandidacy over every term) - the part of Speed Writing that
// runs synchronously in the reader before any network lookups fire, so it's
// the part that can actually cause jank.
function scanCandidates(text: string): void {
  const sentences = nlp(text).json();
  sentences.forEach((sentence) => {
    sentence.terms.forEach((term) => {
      SpeedWritingTools.analyzeTermForCandidacy(term);
    });
  });
}

describe('SpeedWritingTools', () => {
  bench('candidacy scan (short paragraph)', () => {
    scanCandidates(SHORT_TEXT);
  });

  bench('candidacy scan (medium, 20x)', () => {
    scanCandidates(MEDIUM_TEXT);
  });
});
