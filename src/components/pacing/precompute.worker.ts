import type { LegacyPacingConfig } from '../schemas';
import { pacingMultiplier } from '../Reader/wordTiming';
import { tokenSentences } from './sentences';

interface WorkerRequest {
  text: string;
  config: LegacyPacingConfig;
  enabled: boolean;
  sentences?: string[];
}

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: Float32Array, transfer: Transferable[]): void;
};

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const words = event.data.text.match(/\S+/g) ?? [];
  const sentences = event.data.sentences ?? tokenSentences(words);
  const multipliers = new Float32Array(words.length);
  const scored = new Map<string, Map<string, number>>();
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]!;
    const sentence = sentences[index] ?? word;
    let sentenceScores = scored.get(sentence);
    if (!sentenceScores) {
      sentenceScores = new Map();
      scored.set(sentence, sentenceScores);
    }
    let multiplier = sentenceScores.get(word);
    if (multiplier === undefined) {
      multiplier = pacingMultiplier(
        word,
        event.data.config,
        event.data.enabled,
        sentence,
      );
      sentenceScores.set(word, multiplier);
    }
    multipliers[index] = multiplier;
  }
  workerScope.postMessage(multipliers, [multipliers.buffer]);
};
