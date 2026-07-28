import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import SpeedWritingTools from './SpeedWritingTools';

describe('SpeedWritingTools.matchCase', () => {
  it('lowercase replacement stays lowercase when the original is lowercase', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z]*$/),
        fc.stringMatching(/^[a-z][a-z]*$/),
        (original, replacement) => {
          expect(SpeedWritingTools.matchCase(original, replacement)).toBe(
            replacement,
          );
        },
      ),
    );
  });

  it("preserves the replacement's length and character set (only casing changes)", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z][A-Za-z]*$/),
        fc.stringMatching(/^[a-z][a-z]*$/),
        (original, replacement) => {
          const result = SpeedWritingTools.matchCase(original, replacement);
          expect(result.toLowerCase()).toBe(replacement.toLowerCase());
          expect(result.length).toBe(replacement.length);
        },
      ),
    );
  });

  it('an all-uppercase original produces an all-uppercase result', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z][A-Z]*$/),
        fc.stringMatching(/^[a-z][a-z]*$/),
        (original, replacement) => {
          // matchCase's ALL-CAPS branch requires the original be uppercase AND
          // differ from its own lowercase form (i.e. contain at least one
          // letter) - guaranteed by the regex above.
          expect(SpeedWritingTools.matchCase(original, replacement)).toBe(
            replacement.toUpperCase(),
          );
        },
      ),
    );
  });

  it('empty original returns the replacement unchanged', () => {
    fc.assert(
      fc.property(fc.string(), (replacement) => {
        expect(SpeedWritingTools.matchCase('', replacement)).toBe(replacement);
      }),
    );
  });
});

describe('SpeedWritingTools.findSubstitutableCategory', () => {
  it('rejects any term shorter than the minimum word length', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z]{1,3}$/), (text) => {
        const category = SpeedWritingTools.findSubstitutableCategory({
          text,
          tags: ['Noun'],
          normal: text.toLowerCase(),
        });
        expect(category).toBeNull();
      }),
    );
  });

  it('rejects any term tagged as a category this module always excludes', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z]{4,20}$/),
        fc.constantFrom('ProperNoun', 'Hyphenated', 'Value', 'Url', 'Acronym'),
        (text, excludeTag) => {
          const category = SpeedWritingTools.findSubstitutableCategory({
            text,
            tags: [excludeTag, 'Noun'],
            normal: text.toLowerCase(),
          });
          expect(category).toBeNull();
        },
      ),
    );
  });

  it('rejects non-alphabetic text regardless of tags', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 4 }).filter((s) => /[^A-Za-z]/.test(s)),
        (text) => {
          const category = SpeedWritingTools.findSubstitutableCategory({
            text,
            tags: ['Noun'],
            normal: text.toLowerCase(),
          });
          expect(category).toBeNull();
        },
      ),
    );
  });

  it('accepts a long-enough alphabetic term tagged with exactly one content category', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Za-z]{4,20}$/),
        fc.constantFrom('Noun', 'Verb', 'Adjective', 'Adverb'),
        (text, category) => {
          expect(
            SpeedWritingTools.findSubstitutableCategory({
              text,
              tags: [category],
              normal: text.toLowerCase(),
            }),
          ).toBe(category);
        },
      ),
    );
  });
});
