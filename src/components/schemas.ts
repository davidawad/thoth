import { z } from 'zod';
import TextParsingTools from './TextParsingTools';
import {
  PDF_MIME_TYPE,
  EPUB_MIME_TYPE,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';

/*
Zod schemas for the app's external boundaries: data this app didn't
generate itself and can't rely on the type system alone to guarantee -
a third-party API response, whatever a previous (possibly older) version
of the app left in localStorage, and a file the user dropped in. Each
schema's caller falls back to a safe default on a failed parse rather
than throwing, matching the "never break the reading experience" contract
already established for these code paths.
*/

// --- Datamuse API (src/components/SpeedWritingTools.ts) --------------------
// Datamuse's docs (https://www.datamuse.com/api/) only guarantee `word` is
// present; `score`/`tags` depend on which query flags were used, so they're
// optional rather than assumed.
export const datamuseResultSchema = z.object({
  word: z.string(),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const datamuseResponseSchema = z.array(datamuseResultSchema);

// --- localStorage (pages/index.tsx) -----------------------------------------
// Single source of truth for valid metric keys is TextParsingTools'
// READABILITY_METRICS list (also what drives the SettingsPanel combobox) -
// derived here instead of duplicated, so a stored value from a since-removed
// metric (or hand-edited storage) can't silently pass through.
const readabilityMetricKeys = TextParsingTools.READABILITY_METRICS.map(
  (metric) => metric.key,
) as [string, ...string[]];

export const readabilityMetricSchema = z.enum(readabilityMetricKeys);

// localStorage only ever stores strings - booleans are persisted as the
// literal strings "true"/"false" (see SettingsPanel's speed-writing toggle).
export const storedBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

// --- File uploads (src/components/FileParser/FileParser.tsx) ---------------
export const uploadedFileSchema = z.object({
  name: z.string().min(1),
  type: z.enum([PDF_MIME_TYPE, EPUB_MIME_TYPE]),
  size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
});

// Runtime-safe pacing configuration. Weights are normalized by the engine.
export const pacingConfigSchema = z
  .object({
    weights: z.record(z.string(), z.number().finite().nonnegative()),
    minMultiplier: z.number().finite().positive(),
    maxMultiplier: z.number().finite().positive(),
    curve: z.number().finite().positive(),
    smoothing: z.number().finite().min(0).max(1),
  })
  .refine((config) => config.minMultiplier <= config.maxMultiplier, {
    message: 'minMultiplier must be <= maxMultiplier',
  });
export type PacingConfig = z.infer<typeof pacingConfigSchema>;

export const DEFAULT_PACING_CONFIG: PacingConfig = {
  weights: { wordDifficulty: 1 },
  minMultiplier: 0.01,
  maxMultiplier: 100,
  curve: 1,
  smoothing: 1,
};
