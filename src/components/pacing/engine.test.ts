import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_PACING_ENGINE_CONFIG,
  pacingEngineConfigSchema,
} from '../schemas';
import {
  dwellMultiplier,
  scorerRegistry,
  wordDifficultyScorer,
  type Scorer,
} from './engine';

describe('normalized pacing engine', () => {
  it('validates defaults and registers the legacy word difficulty scorer', () => {
    expect(pacingEngineConfigSchema.parse({})).toEqual(
      DEFAULT_PACING_ENGINE_CONFIG,
    );
    expect(scorerRegistry.get('word-difficulty')).toBe(wordDifficultyScorer);
    expect(wordDifficultyScorer.score('the')).toBeGreaterThanOrEqual(0);
    expect(wordDifficultyScorer.score('the')).toBeLessThanOrEqual(1);
  });

  it('normalizes configured weights before blending scores', () => {
    scorerRegistry.register({
      key: 'engine-test-low',
      label: 'Low',
      granularity: 'word',
      score: () => 0,
    });
    scorerRegistry.register({
      key: 'engine-test-high',
      label: 'High',
      granularity: 'word',
      score: () => 1,
    });
    const config = {
      ...DEFAULT_PACING_ENGINE_CONFIG,
      minMultiplier: 0,
      maxMultiplier: 2,
      scorers: [
        { key: 'engine-test-low', weight: 3 },
        { key: 'engine-test-high', weight: 1 },
      ],
    };
    expect(dwellMultiplier('unit', config)).toBe(0.5);
  });

  it('respects output bounds and is monotonic in scorer complexity', () => {
    const varying: Scorer<string> = {
      key: 'engine-test-varying',
      label: 'Varying',
      granularity: 'word',
      score: (value) => Number(value),
    };
    scorerRegistry.register(varying);
    const config = {
      ...DEFAULT_PACING_ENGINE_CONFIG,
      minMultiplier: 0.5,
      maxMultiplier: 2,
      scorers: [{ key: varying.key, weight: 4 }],
    };

    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (left, right) => {
          const low = dwellMultiplier(String(Math.min(left, right)), config);
          const high = dwellMultiplier(String(Math.max(left, right)), config);
          expect(low).toBeGreaterThanOrEqual(config.minMultiplier);
          expect(high).toBeLessThanOrEqual(config.maxMultiplier);
          expect(high).toBeGreaterThanOrEqual(low);
        },
      ),
    );
  });
});
