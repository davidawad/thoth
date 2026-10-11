import { describe, expect, it } from 'vitest';
import TextParsingTools from '../TextParsingTools';
import { formulaScorers } from './formulaScorers';
import { scorerRegistry } from './scorers';

describe('sentence formula scorers', () => {
  it('registers each formula as a sentence scorer', () => {
    expect(
      formulaScorers.map(({ id, granularity }) => [id, granularity]),
    ).toEqual([
      ['fleschKincaid', 'sentence'],
      ['gunningFog', 'sentence'],
      ['smog', 'sentence'],
      ['colemanLiau', 'sentence'],
      ['automatedReadability', 'sentence'],
      ['daleChall', 'sentence'],
      ['spache', 'sentence'],
      ['lexicalDensity', 'sentence'],
    ]);
    for (const scorer of formulaScorers)
      expect(scorerRegistry.get(scorer.id)).toBe(scorer);
  });

  it('produces positive finite multipliers for reference sentences', () => {
    expect(
      formulaScorers.map(({ scoreSentence }) =>
        scoreSentence?.('The cat sat on the mat.'),
      ),
    ).toEqual([0.7, 0.7, 0.7, 0.7, 0.7, 1 + 1 / 6, 1 + 1 / 6, 1 + 1 / 12]);
    for (const scorer of formulaScorers) {
      for (const sentence of [
        'The cat sat on the mat.',
        'The intricate transformation demonstrates considerable complexity.',
      ]) {
        const value = scorer.scoreSentence?.(sentence);
        expect(value, `${scorer.id}: ${sentence}`).toBeGreaterThan(0);
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it('maps lexical density of a familiar simple sentence to its configured age band', () => {
    const lexical = formulaScorers.find(({ id }) => id === 'lexicalDensity');
    const counts = TextParsingTools.computeCounts('The cat sat on the mat.');
    const expectedAge = TextParsingTools.generateScores(counts).lexicalDensity;
    const expected = 1 + (expectedAge - 12) / 6;
    expect(lexical?.scoreSentence?.('The cat sat on the mat.')).toBeCloseTo(
      expected,
      5,
    );
  });
});
