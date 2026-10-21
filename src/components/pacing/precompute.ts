import type { LegacyPacingConfig } from '../schemas';
import { pacingMultiplier } from '../Reader/wordTiming';
import { tokenSentences } from './sentences';

export type PacingMultipliers = Float32Array;

// Stable serialization makes equivalent configs share cache entries regardless
// of property insertion order.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function hash(value: string): string {
  // 64-bit FNV-1a, using bigint to avoid platform-dependent overflow.
  let result = 0xcbf29ce484222325n;
  for (let index = 0; index < value.length; index += 1) {
    result ^= BigInt(value.charCodeAt(index));
    result = BigInt.asUintN(64, result * 0x100000001b3n);
  }
  return result.toString(16).padStart(16, '0');
}

export function pacingCacheKey(
  text: string,
  config: LegacyPacingConfig,
  enabled = true,
  sentences?: string[],
): string {
  let sentenceKey = 'default-sentences';
  if (sentences) {
    const sentenceHashes = new Map<string, string>();
    const ranges: { start: number; sentence: string }[] = [];
    sentences.forEach((sentence, index) => {
      if (index > 0 && sentences[index - 1] === sentence) return;
      let sentenceHash = sentenceHashes.get(sentence);
      if (!sentenceHash) {
        sentenceHash = hash(sentence);
        sentenceHashes.set(sentence, sentenceHash);
      }
      ranges.push({ start: index, sentence: sentenceHash });
    });
    sentenceKey = hash(canonical(ranges));
  }
  return `${hash(text)}:${hash(canonical(config))}:${enabled}:${sentenceKey}`;
}

export interface PacingPrecomputeOptions {
  /** Set false to force the chunked fallback (also useful in non-worker hosts). */
  useWorker?: boolean;
  chunkSize?: number;
  enabled?: boolean;
  sentences?: string[];
}

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function')
      requestIdleCallback(() => resolve());
    else setTimeout(resolve, 0);
  });
}

async function computeChunked(
  text: string,
  config: LegacyPacingConfig,
  enabled: boolean,
  chunkSize: number,
  sentenceList?: string[],
): Promise<PacingMultipliers> {
  const words = text.match(/\S+/g) ?? [];
  const sentences = sentenceList ?? tokenSentences(words);
  const result = new Float32Array(words.length);
  const scored = new Map<string, Map<string, number>>();
  for (let start = 0; start < words.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, words.length);
    for (let index = start; index < end; index += 1) {
      const word = words[index]!;
      const sentence = sentences[index] ?? word;
      let sentenceScores = scored.get(sentence);
      if (!sentenceScores) {
        sentenceScores = new Map();
        scored.set(sentence, sentenceScores);
      }
      let multiplier = sentenceScores.get(word);
      if (multiplier === undefined) {
        multiplier = pacingMultiplier(word, config, enabled, sentence);
        sentenceScores.set(word, multiplier);
      }
      result[index] = multiplier;
    }
    if (end < words.length) await idle();
  }
  return result;
}

function computeInWorker(
  text: string,
  config: LegacyPacingConfig,
  enabled: boolean,
  sentences?: string[],
): Promise<PacingMultipliers> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./precompute.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (event: MessageEvent<Float32Array>) => {
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error(event.message));
    };
    worker.postMessage({ text, config, enabled, sentences });
  });
}

/** Small Reader-facing service for asynchronously precomputing word dwell values. */
export class PacingPrecomputeCache {
  private readonly cache = new Map<string, PacingMultipliers>();
  private activeConfigHash: string | undefined;
  private generation = 0;

  async get(
    text: string,
    config: LegacyPacingConfig,
    options: PacingPrecomputeOptions = {},
  ): Promise<PacingMultipliers> {
    const enabled = options.enabled ?? true;
    const key = pacingCacheKey(text, config, enabled, options.sentences);
    const configHash = `${hash(canonical(config))}:${enabled}`;
    if (
      this.activeConfigHash !== undefined &&
      this.activeConfigHash !== configHash
    ) {
      this.cache.clear();
      this.generation += 1;
    }
    this.activeConfigHash = configHash;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const chunkSize = Math.max(1, options.chunkSize ?? 10_000);
    const generation = this.generation;
    let values: PacingMultipliers;
    if (options.useWorker !== false && typeof Worker !== 'undefined') {
      try {
        values = await computeInWorker(
          text,
          config,
          enabled,
          options.sentences,
        );
      } catch {
        values = await computeChunked(
          text,
          config,
          enabled,
          chunkSize,
          options.sentences,
        );
      }
    } else {
      values = await computeChunked(
        text,
        config,
        enabled,
        chunkSize,
        options.sentences,
      );
    }
    if (
      generation === this.generation &&
      this.activeConfigHash === configHash
    ) {
      this.cache.set(key, values);
    }
    return values;
  }

  invalidate(): void {
    this.cache.clear();
    this.activeConfigHash = undefined;
    this.generation += 1;
  }

  get size(): number {
    return this.cache.size;
  }
}

export const pacingPrecomputeCache = new PacingPrecomputeCache();
