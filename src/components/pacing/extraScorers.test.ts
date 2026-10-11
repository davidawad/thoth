import { describe, expect, it } from 'vitest';
import {
  clauseDepthScorer,
  wordLengthScorer,
  wordRarityScorer,
} from './extraScorers';
import { scorerRegistry } from './scorers';

describe('additional pacing scorers', () => {
  it('registers the rarity, clause depth, and word length scorers', () => {
    expect(scorerRegistry.get('wordRarity')).toBe(wordRarityScorer);
    expect(scorerRegistry.get('clauseDepth')).toBe(clauseDepthScorer);
    expect(scorerRegistry.get('wordLength')).toBe(wordLengthScorer);
  });

  it('scores uncommon words as longer than common words', () => {
    expect(wordRarityScorer.score('the')).toBeLessThan(1);
    expect(wordRarityScorer.score('sesquipedalian')).toBeGreaterThan(1);
    expect(wordRarityScorer.score('unlistedword')).toBeGreaterThan(1);
  });

  it('uses sentence granularity for clause depth and increases for embedded clauses', () => {
    expect(clauseDepthScorer.granularity).toBe('sentence');
    expect(clauseDepthScorer.scoreSentence?.('Birds sing.')).toBe(1);
    expect(
      clauseDepthScorer.scoreSentence?.(
        'Although it was late, the birds sang, while the rain fell.',
      ),
    ).toBeGreaterThan(1);
  });

  it('accounts for length and syllables at word and sentence granularity', () => {
    expect(wordLengthScorer.score('a')).toBeLessThan(1);
    expect(wordLengthScorer.score('sesquipedalian')).toBeGreaterThan(1);
    expect(wordLengthScorer.scoreSentence?.('a cat')).toBeLessThan(1);
    expect(
      wordLengthScorer.scoreSentence?.('The sesquipedalian terminology'),
    ).toBeGreaterThan(1);
  });
});
