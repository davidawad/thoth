import { describe, expect, it } from 'vitest';
import { countWords } from './bookModel';
import { endsSentence, tokenizePage } from './pageWords';

describe('endsSentence', () => {
  it('knows real ends from abbreviations', () => {
    expect(endsSentence('done.')).toBe(true);
    expect(endsSentence('why?”')).toBe(true);
    expect(endsSentence('Dr.')).toBe(false);
    expect(endsSentence('J.')).toBe(false);
    expect(endsSentence('comma,')).toBe(false);
  });
});

describe('tokenizePage', () => {
  const text = 'It was Dr. Who. He ran away! Why?\n\nSecond para here.';
  it('keeps the word count identical to countWords', () => {
    expect(tokenizePage(text).words).toHaveLength(countWords(text));
  });
  it('groups words into sentences and paragraphs', () => {
    const t = tokenizePage(text);
    expect(t.paragraphs).toHaveLength(2);
    expect(
      t.paragraphs[0]?.map((s) => s.words.map((w) => w.text).join(' ')),
    ).toEqual(['It was Dr. Who.', 'He ran away!', 'Why?']);
    expect(t.sentenceOf[0]).toBe(0);
    expect(t.sentenceOf.at(-1)).toBe(3);
  });
  it('an unterminated paragraph still closes its sentence', () => {
    const t = tokenizePage('no stop here\n\nnext');
    expect(t.sentenceOf).toEqual([0, 0, 0, 1]);
  });
});
