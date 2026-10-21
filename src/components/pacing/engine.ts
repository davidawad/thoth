import TextParsingTools from '../TextParsingTools';
import type { PacingConfig } from '../schemas';

export type ScorerGranularity = 'word' | 'sentence' | 'both';

export interface ScorerContext {
  sentence?: string;
  index?: number;
  previousScores?: readonly number[];
}

/** A complexity score in the closed interval [0, 1]. */
export interface Scorer<Unit = string> {
  key: string;
  label: string;
  granularity: ScorerGranularity;
  score(unit: Unit, ctx?: ScorerContext): number;
}

const scorers = new Map<string, Scorer<unknown>>();

export const scorerRegistry = {
  register<Unit>(scorer: Scorer<Unit>): void {
    scorers.set(scorer.key, scorer as Scorer<unknown>);
  },
  get(key: string): Scorer<unknown> | undefined {
    return scorers.get(key);
  },
  list(): Scorer<unknown>[] {
    return [...scorers.values()];
  },
};

// The historical multiplier is bounded by [1, 3]. Encoding that range as
// [0, 1] lets the engine preserve its original dwell while honoring the
// normalized scorer contract.
export const wordDifficultyScorer: Scorer<string> = {
  key: 'word-difficulty',
  label: 'Word difficulty',
  granularity: 'word',
  score: (unit) =>
    Math.max(
      0,
      Math.min(1, (TextParsingTools.wordDifficultyMultiplier(unit) - 1) / 2),
    ),
};

scorerRegistry.register(wordDifficultyScorer);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function curveScore(score: number, curve: PacingConfig['curve']): number {
  const bounded = clamp(score, 0, 1);
  return curve === 'ease' ? bounded * bounded * (3 - 2 * bounded) : bounded;
}

function smoothed(
  value: number,
  config: PacingConfig,
  history: readonly number[],
): number {
  const { method, window } = config.smoothing;
  if (window <= 1 || history.length === 0) return value;
  const recent = history.slice(-Math.max(0, window - 1));
  if (method === 'moving-average') {
    const values = [...recent, value];
    return values.reduce((sum, item) => sum + item, 0) / values.length;
  }
  // EMA over the configured window, with alpha chosen for an N-sample window.
  const alpha = 2 / (window + 1);
  const [first, ...prior] = recent;
  const priorAverage = prior.reduce(
    (average, item) => average + alpha * (item - average),
    first ?? value,
  );
  return priorAverage + alpha * (value - priorAverage);
}

/** Pure single-unit dwell mapping. `ctx.previousScores` supplies smoothing history. */
export function dwellMultiplier(
  unit: unknown,
  config: PacingConfig,
  ctx: ScorerContext = {},
): number {
  if (!config.enabled) return 1;

  const applicable = config.scorers
    .map(({ key, weight }) => ({ scorer: scorerRegistry.get(key), weight }))
    .filter(
      ({ scorer, weight }) =>
        scorer !== undefined &&
        weight > 0 &&
        (config.granularity === 'both' ||
          scorer.granularity === 'both' ||
          scorer.granularity === config.granularity),
    );
  const totalWeight = applicable.reduce((sum, item) => sum + item.weight, 0);
  const normalized =
    totalWeight === 0
      ? 0
      : applicable.reduce((sum, { scorer, weight }) => {
          const raw = scorer!.score(unit, ctx);
          return sum + clamp(Number.isFinite(raw) ? raw : 0, 0, 1) * weight;
        }, 0) / totalWeight;
  const curved = curveScore(normalized, config.curve);
  const mapped =
    config.minMultiplier +
    curved * (config.maxMultiplier - config.minMultiplier);
  return clamp(
    smoothed(mapped, config, ctx.previousScores ?? []),
    config.minMultiplier,
    config.maxMultiplier,
  );
}
