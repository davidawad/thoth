import type { LegacyPacingConfig } from '../schemas';
import { scoreDwellMultiplier } from './dwellMultiplier';

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
): string {
  return `${hash(text)}:${hash(canonical(config))}`;
}

export interface PacingPrecomputeOptions {
  /** Set false to force the chunked fallback (also useful in non-worker hosts). */
  useWorker?: boolean;
  chunkSize?: number;
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
  chunkSize: number,
): Promise<PacingMultipliers> {
  const words = text.match(/\S+/g) ?? [];
  const result = new Float32Array(words.length);
  const scored = new Map<string, number>();
  let previous: number | undefined;
  for (let start = 0; start < words.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, words.length);
    for (let index = start; index < end; index += 1) {
      const word = words[index]!;
      let target = scored.get(word);
      if (target === undefined) {
        target = scoreDwellMultiplier(word, config);
        scored.set(word, target);
      }
      previous =
        previous === undefined
          ? target
          : Math.min(
              config.maxMultiplier,
              Math.max(
                config.minMultiplier,
                previous + config.smoothing * (target - previous),
              ),
            );
      result[index] = previous;
    }
    if (end < words.length) await idle();
  }
  return result;
}

function computeInWorker(
  text: string,
  config: LegacyPacingConfig,
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
    worker.postMessage({ text, config });
  });
}

/** Small Reader-facing service for asynchronously precomputing word dwell values. */
export class PacingPrecomputeCache {
  private readonly cache = new Map<string, PacingMultipliers>();
  private activeConfigHash: string | undefined;

  async get(
    text: string,
    config: LegacyPacingConfig,
    options: PacingPrecomputeOptions = {},
  ): Promise<PacingMultipliers> {
    const key = pacingCacheKey(text, config);
    const configHash = key.slice(key.indexOf(':') + 1);
    if (
      this.activeConfigHash !== undefined &&
      this.activeConfigHash !== configHash
    )
      this.cache.clear();
    this.activeConfigHash = configHash;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const chunkSize = Math.max(1, options.chunkSize ?? 10_000);
    let values: PacingMultipliers;
    if (options.useWorker !== false && typeof Worker !== 'undefined') {
      try {
        values = await computeInWorker(text, config);
      } catch {
        values = await computeChunked(text, config, chunkSize);
      }
    } else {
      values = await computeChunked(text, config, chunkSize);
    }
    this.cache.set(key, values);
    return values;
  }

  invalidate(): void {
    this.cache.clear();
    this.activeConfigHash = undefined;
  }

  get size(): number {
    return this.cache.size;
  }
}

export const pacingPrecomputeCache = new PacingPrecomputeCache();
