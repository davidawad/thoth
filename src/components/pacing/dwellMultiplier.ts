import type { LegacyPacingConfig, PacingConfig } from '../schemas';
import type { ScorerContext } from './engine';
import { dwellMultiplier as normalizedDwellMultiplier } from './engine';
import { scorerRegistry } from './scorers';

export interface ScorerValue {
  scorerId: string;
  value: number;
}

/** Blend scorer multipliers, clamp, curve around 1, then smooth against history. */
function legacyDwellMultiplier(
  values: ScorerValue[],
  config: LegacyPacingConfig,
  previous?: number,
): number {
  const weighted = values.reduce(
    (acc, { scorerId, value }) => {
      const weight = config.weights[scorerId] ?? 0;
      return weight > 0 && Number.isFinite(value)
        ? { sum: acc.sum + weight * value, weight: acc.weight + weight }
        : acc;
    },
    { sum: 0, weight: 0 },
  );
  const blend = weighted.weight === 0 ? 1 : weighted.sum / weighted.weight;
  const bounded = Math.min(
    config.maxMultiplier,
    Math.max(config.minMultiplier, blend),
  );
  const curved =
    1 + Math.sign(bounded - 1) * Math.pow(Math.abs(bounded - 1), config.curve);
  const target = Math.min(
    config.maxMultiplier,
    Math.max(config.minMultiplier, curved),
  );
  if (previous === undefined || !Number.isFinite(previous)) return target;
  const smoothed = previous + config.smoothing * (target - previous);
  return Math.min(
    config.maxMultiplier,
    Math.max(config.minMultiplier, smoothed),
  );
}

/** Apply normalized complexity scores, or use the legacy value blend overload. */
export function dwellMultiplier(
  unit: unknown,
  config: PacingConfig,
  ctx?: ScorerContext,
): number;
export function dwellMultiplier(
  values: ScorerValue[],
  config: LegacyPacingConfig,
  previous?: number,
): number;
export function dwellMultiplier(
  unitOrValues: unknown,
  config: PacingConfig | LegacyPacingConfig,
  ctxOrPrevious?: ScorerContext | number,
): number {
  if (Array.isArray(unitOrValues)) {
    return legacyDwellMultiplier(
      unitOrValues as ScorerValue[],
      config as LegacyPacingConfig,
      typeof ctxOrPrevious === 'number' ? ctxOrPrevious : undefined,
    );
  }
  return normalizedDwellMultiplier(
    unitOrValues,
    config as PacingConfig,
    typeof ctxOrPrevious === 'object' ? ctxOrPrevious : undefined,
  );
}

/** Score a word using the configured scorers, then apply the pacing blend. */
export function scoreDwellMultiplier(
  word: string,
  config: LegacyPacingConfig,
  previous?: number,
  containingSentence?: string,
): number {
  const values = Object.keys(config.weights).flatMap((scorerId) => {
    const scorer = scorerRegistry.get(scorerId);
    if (!scorer) return [];
    const sentenceScore =
      scorer.granularity === 'sentence' && containingSentence
        ? scorer.scoreSentence?.(containingSentence)
        : undefined;
    return [{ scorerId, value: sentenceScore ?? scorer.score(word) }];
  });
  return dwellMultiplier(values, config, previous);
}
