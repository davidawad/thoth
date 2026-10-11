import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DEFAULT_PACING_CONFIG, pacingConfigSchema } from '../schemas';
import { dwellMultiplier } from './dwellMultiplier';
import { scorerRegistry, wordDifficultyScorer } from './scorers';

describe('pacing config', () => {
  it('accepts the default config and rejects invalid bounds', () => {
    expect(pacingConfigSchema.parse(DEFAULT_PACING_CONFIG)).toEqual(
      DEFAULT_PACING_CONFIG,
    );
    expect(
      pacingConfigSchema.safeParse({
        ...DEFAULT_PACING_CONFIG,
        minMultiplier: 3,
        maxMultiplier: 2,
      }).success,
    ).toBe(false);
    expect(
      pacingConfigSchema.safeParse({ ...DEFAULT_PACING_CONFIG, smoothing: 2 })
        .success,
    ).toBe(false);
  });
});

describe('scorer registry', () => {
  it('registers and retrieves scorers, including default word difficulty', () => {
    expect(scorerRegistry.get('wordDifficulty')).toBe(wordDifficultyScorer);
    const scorer = { id: 'test-scorer', score: () => 1 };
    scorerRegistry.register(scorer);
    expect(scorerRegistry.get(scorer.id)).toBe(scorer);
  });
});

describe('dwellMultiplier', () => {
  const config = (overrides: Partial<typeof DEFAULT_PACING_CONFIG> = {}) => ({
    ...DEFAULT_PACING_CONFIG,
    weights: { first: 1, second: 1 },
    ...overrides,
  });

  it('blends values by their configured weights', () => {
    expect(
      dwellMultiplier(
        [
          { scorerId: 'first', value: 2 },
          { scorerId: 'second', value: 4 },
        ],
        config({ weights: { first: 3, second: 1 } }),
      ),
    ).toBe(2.5);
  });

  it('bounds the blend and applies a curve around baseline', () => {
    expect(
      dwellMultiplier(
        [{ scorerId: 'first', value: 9 }],
        config({ minMultiplier: 0.5, maxMultiplier: 2, curve: 2 }),
      ),
    ).toBe(2);
    expect(
      dwellMultiplier([{ scorerId: 'first', value: 2 }], config({ curve: 2 })),
    ).toBe(2);
  });

  it('smooths from the previous multiplier', () => {
    expect(
      dwellMultiplier(
        [{ scorerId: 'first', value: 3 }],
        config({ smoothing: 0.25 }),
        1,
      ),
    ).toBe(1.5);
  });

  it('uses neutral baseline for missing scorers and remains bounded for finite inputs', () => {
    expect(dwellMultiplier([], config())).toBe(1);
    fc.assert(
      fc.property(fc.double({ min: 0.01, max: 100, noNaN: true }), (value) => {
        const result = dwellMultiplier(
          [{ scorerId: 'first', value }],
          config({ minMultiplier: 0.5, maxMultiplier: 2 }),
          1,
        );
        expect(result).toBeGreaterThanOrEqual(0.5);
        expect(result).toBeLessThanOrEqual(2);
      }),
    );
  });
});
