import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import Reader from './Reader';
import { scorerRegistry } from '../pacing/scorers';

const seen: string[] = [];
scorerRegistry.register({
  id: 'readerSentenceProbe',
  granularity: 'sentence',
  score: () => 1,
  scoreSentence: (sentence) => {
    seen.push(sentence);
    return 1;
  },
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  seen.length = 0;
});

describe('Reader sentence pacing', () => {
  it('gives every word of a sentence the complete sentence', () => {
    window.localStorage.setItem(
      'thoth.pacingConfig',
      JSON.stringify({
        weights: { readerSentenceProbe: 1 },
        minMultiplier: 0.5,
        maxMultiplier: 2,
        curve: 1,
        smoothing: 1,
      }),
    );
    render(
      <Reader content="The cat sat on the mat. Dogs run." readingSpeed={300} />,
    );

    // One call per word, in order, for the constructor's parse.
    expect(seen.slice(0, 8)).toEqual([
      ...Array(6).fill('The cat sat on the mat.'),
      'Dogs run.',
      'Dogs run.',
    ]);
  });
});
