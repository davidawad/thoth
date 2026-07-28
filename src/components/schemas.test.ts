import { describe, it, expect } from 'vitest';
import {
  datamuseResultSchema,
  datamuseResponseSchema,
  readabilityMetricSchema,
  storedBooleanSchema,
  uploadedFileSchema,
} from './schemas';
import {
  PDF_MIME_TYPE,
  EPUB_MIME_TYPE,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';

describe('datamuseResultSchema / datamuseResponseSchema', () => {
  it('accepts a result with only the guaranteed `word` field', () => {
    expect(datamuseResultSchema.safeParse({ word: 'happy' }).success).toBe(
      true,
    );
  });

  it('accepts a full result with score and tags', () => {
    const result = datamuseResultSchema.safeParse({
      word: 'happy',
      score: 42,
      tags: ['syn', 'adj'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a result missing the required `word` field', () => {
    expect(datamuseResultSchema.safeParse({ score: 42 }).success).toBe(false);
  });

  it('rejects a malformed API response (not an array)', () => {
    expect(datamuseResponseSchema.safeParse({ word: 'happy' }).success).toBe(
      false,
    );
  });

  it('accepts an empty array (no results)', () => {
    expect(datamuseResponseSchema.safeParse([]).success).toBe(true);
  });
});

describe('readabilityMetricSchema', () => {
  it('accepts every known metric key', () => {
    expect(readabilityMetricSchema.safeParse('average').success).toBe(true);
    expect(readabilityMetricSchema.safeParse('flesch').success).toBe(true);
    expect(readabilityMetricSchema.safeParse('lexicalDensity').success).toBe(
      true,
    );
  });

  it('rejects an unrecognized/tampered localStorage value', () => {
    expect(readabilityMetricSchema.safeParse('not-a-real-metric').success).toBe(
      false,
    );
  });

  it('rejects null (key never set)', () => {
    expect(readabilityMetricSchema.safeParse(null).success).toBe(false);
  });
});

describe('storedBooleanSchema', () => {
  it('parses "true" to true', () => {
    const result = storedBooleanSchema.safeParse('true');
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(true);
  });

  it('parses "false" to false', () => {
    const result = storedBooleanSchema.safeParse('false');
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(false);
  });

  it('rejects null (key never set) and garbage strings', () => {
    expect(storedBooleanSchema.safeParse(null).success).toBe(false);
    expect(storedBooleanSchema.safeParse('yes').success).toBe(false);
  });
});

describe('uploadedFileSchema', () => {
  it('accepts a plausible PDF upload', () => {
    const result = uploadedFileSchema.safeParse({
      name: 'book.pdf',
      type: PDF_MIME_TYPE,
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a plausible EPUB upload', () => {
    const result = uploadedFileSchema.safeParse({
      name: 'book.epub',
      type: EPUB_MIME_TYPE,
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported MIME type (e.g. a renamed .exe)', () => {
    const result = uploadedFileSchema.safeParse({
      name: 'not-a-book.pdf',
      type: 'application/x-msdownload',
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a file over the size cap', () => {
    const result = uploadedFileSchema.safeParse({
      name: 'huge.pdf',
      type: PDF_MIME_TYPE,
      size: MAX_UPLOAD_SIZE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty/zero-byte file', () => {
    const result = uploadedFileSchema.safeParse({
      name: 'empty.pdf',
      type: PDF_MIME_TYPE,
      size: 0,
    });
    expect(result.success).toBe(false);
  });
});
