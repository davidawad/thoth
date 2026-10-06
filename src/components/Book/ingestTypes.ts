export type IngestPhase = 'reading' | 'parsing' | 'saving';

export interface IngestProgress {
  phase: IngestPhase;
  /** 0..1 within the parsing phase; undefined when indeterminate. */
  fraction?: number | undefined;
  label: string;
}

export type ProgressFn = (p: IngestProgress) => void;

export type IngestErrorCode =
  'unsupported' | 'corrupt' | 'no-text' | 'too-large' | 'encrypted';

/** An error whose message is safe to show to the reader as-is. */
export class IngestError extends Error {
  code: IngestErrorCode;
  constructor(code: IngestErrorCode, message: string) {
    super(message);
    this.name = 'IngestError';
    this.code = code;
  }
}

let lastYield = 0;

/**
 * Cooperative yield: lets the browser paint and handle input between chunks
 * of parsing, but only when ~12ms have passed since the last yield, so a
 * 500-page parse is not slowed by thousands of timer clamps.
 */
export async function yieldToBrowser(force = false): Promise<void> {
  const now = Date.now();
  if (force || now - lastYield > 12) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    lastYield = Date.now();
  }
}
