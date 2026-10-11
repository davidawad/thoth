import TextParsingTools from '../TextParsingTools';

/** Scorers return a positive relative dwell multiplier; 1 means baseline. */
export interface Scorer {
  id: string;
  score: (word: string) => number;
}

export const wordDifficultyScorer: Scorer = {
  id: 'wordDifficulty',
  score: (word) => TextParsingTools.wordDifficultyMultiplier(word),
};

const scorers = new Map<string, Scorer>([
  [wordDifficultyScorer.id, wordDifficultyScorer],
]);

export const scorerRegistry = {
  register(scorer: Scorer): void {
    scorers.set(scorer.id, scorer);
  },
  get(id: string): Scorer | undefined {
    return scorers.get(id);
  },
  list(): Scorer[] {
    return [...scorers.values()];
  },
};
