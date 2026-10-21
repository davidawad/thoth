// Importing this module installs every built-in scorer in the shared registry.
import './formulaScorers';
import './extraScorers';

export {
  scorerRegistry as legacyScorerRegistry,
  wordDifficultyScorer as legacyWordDifficultyScorer,
} from './scorers';
export type { Scorer as LegacyScorer } from './scorers';
export { dwellMultiplier, scoreDwellMultiplier } from './dwellMultiplier';
export * from './sentences';
export * from './precompute';
export { scorerRegistry, wordDifficultyScorer } from './engine';
export type { Scorer, ScorerContext, ScorerGranularity } from './engine';
