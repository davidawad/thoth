import { bench, describe } from 'vitest';
import TextParsingTools from '../src/components/TextParsingTools';
import { SHORT_TEXT, MEDIUM_TEXT, LONG_TEXT } from './fixtures';

// The readability-scoring pass (computeCounts + generateScores) runs on
// every text load and on every settings-panel metric switch - it's the
// single hottest path in the paper's core algorithm.
describe('TextParsingTools', () => {
  bench('computeCounts (short paragraph)', () => {
    TextParsingTools.computeCounts(SHORT_TEXT);
  });

  bench('computeCounts (medium, 20x)', () => {
    TextParsingTools.computeCounts(MEDIUM_TEXT);
  });

  bench('computeCounts (long, 200x)', () => {
    TextParsingTools.computeCounts(LONG_TEXT);
  });

  bench('computeCounts + generateScores (short paragraph)', () => {
    TextParsingTools.generateScores(TextParsingTools.computeCounts(SHORT_TEXT));
  });
});
