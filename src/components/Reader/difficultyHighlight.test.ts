import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  difficultyColor,
  scoreSentences,
  sentenceDifficulty,
  sentenceRanges,
} from './difficultyHighlight';

describe('sentenceRanges', () => {
  it('splits a paragraph into trimmed sentence ranges', () => {
    const text = 'The cat sat. Why did it sit? It was tired!';
    const sentences = sentenceRanges(text).map(({ start, end }) =>
      text.slice(start, end),
    );

    expect(sentences).toEqual([
      'The cat sat.',
      'Why did it sit?',
      'It was tired!',
    ]);
  });

  it('does not split on a decimal point', () => {
    const text = 'It raised $3.5 million. Then it stopped.';
    const sentences = sentenceRanges(text).map(({ start, end }) =>
      text.slice(start, end),
    );

    expect(sentences).toEqual(['It raised $3.5 million.', 'Then it stopped.']);
  });

  it('keeps an unterminated trailing sentence and ignores blank text', () => {
    expect(sentenceRanges('   ')).toEqual([]);
    expect(sentenceRanges('')).toEqual([]);
    expect(sentenceRanges('No full stop here')).toEqual([
      { start: 0, end: 17 },
    ]);
  });

  it('returns ordered, non-overlapping ranges inside the text', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (text) => {
        const ranges = sentenceRanges(text);
        let previousEnd = 0;

        for (const { start, end } of ranges) {
          expect(start).toBeGreaterThanOrEqual(previousEnd);
          expect(end).toBeGreaterThan(start);
          expect(end).toBeLessThanOrEqual(text.length);
          previousEnd = end;
        }
      }),
    );
  });
});

describe('sentenceDifficulty', () => {
  it('rates dense, unfamiliar prose above plain prose', () => {
    expect(
      sentenceDifficulty(
        'Epistemological considerations notwithstanding, perspicacious interlocutors disagree.',
      ),
    ).toBeGreaterThan(sentenceDifficulty('The cat sat on the mat.'));
  });

  it('is 0 when there are no words', () => {
    expect(sentenceDifficulty('...')).toBe(0);
  });
});

describe('scoreSentences', () => {
  it('ranks the harder sentence above the easier one, within [0, 1]', () => {
    const easy = 'The cat sat on the mat.';
    const hard =
      'Epistemological considerations notwithstanding, perspicacious interlocutors disagree.';
    const scores = scoreSentences(`${easy} ${hard}`);

    expect(scores.get(hard)).toBeGreaterThan(scores.get(easy) as number);

    for (const score of scores.values()) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('gives a lone sentence the neutral middle score', () => {
    expect(
      scoreSentences('Just one sentence here.').get('Just one sentence here.'),
    ).toBe(0.5);
  });

  it('keys sentences across paragraph breaks', () => {
    const scores = scoreSentences('First one.\n\nSecond one.');

    expect(scores.has('First one.')).toBe(true);
    expect(scores.has('Second one.')).toBe(true);
  });
});

describe('difficultyColor', () => {
  it('runs from green at 0 to red at 1 through yellow', () => {
    expect(difficultyColor(0)).toBe('hsla(120, 65%, 50%, 0.28)');
    expect(difficultyColor(0.5)).toBe('hsla(60, 65%, 50%, 0.28)');
    expect(difficultyColor(1)).toBe('hsla(0, 65%, 50%, 0.28)');
  });

  it('clamps out-of-range scores', () => {
    expect(difficultyColor(-3)).toBe(difficultyColor(0));
    expect(difficultyColor(9)).toBe(difficultyColor(1));
  });
});
