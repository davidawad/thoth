import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import extractText from './extractText';

describe('extractText', () => {
  it('returns an empty string for null/undefined', () => {
    expect(extractText(null)).toBe('');
    expect(extractText(undefined)).toBe('');
  });

  it('strips HTML tags from a markup string, keeping only the text', () => {
    expect(extractText('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('reads .textContent directly off an Element', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span>Chapter one</span>';
    expect(extractText(el)).toBe('Chapter one');
  });

  it('never throws for arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        expect(() => extractText(input)).not.toThrow();
      }),
    );
  });
});
