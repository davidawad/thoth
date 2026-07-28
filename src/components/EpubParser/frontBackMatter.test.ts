import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  stripGutenbergBoilerplate,
  isSkippableFrontOrBackMatter,
} from './frontBackMatter';

describe('stripGutenbergBoilerplate', () => {
  it('leaves text with no markers unchanged (aside from trimming)', () => {
    expect(stripGutenbergBoilerplate('  Chapter one begins here.  ')).toBe(
      'Chapter one begins here.',
    );
  });

  it('drops the title/license header before a "THE" START marker', () => {
    const page =
      'Phaedo, by Plato This eBook is for the use of anyone anywhere... ' +
      '*** START OF THE PROJECT GUTENBERG EBOOK PHAEDO *** ' +
      'PHAEDO By Plato Translated by Benjamin Jowett Contents INTRODUCTION.';
    expect(stripGutenbergBoilerplate(page)).toBe(
      'PHAEDO By Plato Translated by Benjamin Jowett Contents INTRODUCTION.',
    );
  });

  it('also recognizes the older "THIS" START marker wording', () => {
    const page =
      'Some Book, by Some Author license header text... ' +
      '*** START OF THIS PROJECT GUTENBERG EBOOK SOME BOOK *** ' +
      'SOME BOOK Chapter 1. It was a dark and stormy night.';
    expect(stripGutenbergBoilerplate(page)).toBe(
      'SOME BOOK Chapter 1. It was a dark and stormy night.',
    );
  });

  it('drops the license footer after an END marker', () => {
    const page =
      'Phaedo, by Plato *** END OF THE PROJECT GUTENBERG EBOOK PHAEDO *** ' +
      'Updated editions will replace the previous one...';
    expect(stripGutenbergBoilerplate(page)).toBe('Phaedo, by Plato');
  });

  it('also recognizes the older "THIS" END marker wording', () => {
    const page =
      'Some Book, by Some Author *** END OF THIS PROJECT GUTENBERG EBOOK SOME BOOK *** ' +
      'License footer text follows here...';
    expect(stripGutenbergBoilerplate(page)).toBe('Some Book, by Some Author');
  });

  it('keeps only the real content when both markers are present on one page', () => {
    const page =
      'Title page header *** START OF THE PROJECT GUTENBERG EBOOK X *** ' +
      'The real chapter text goes here. ' +
      '*** END OF THE PROJECT GUTENBERG EBOOK X *** License footer.';
    expect(stripGutenbergBoilerplate(page)).toBe(
      'The real chapter text goes here.',
    );
  });

  it('never throws for arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        expect(() => stripGutenbergBoilerplate(input)).not.toThrow();
      }),
    );
  });
});

describe('isSkippableFrontOrBackMatter', () => {
  it('treats an empty page as skippable', () => {
    expect(isSkippableFrontOrBackMatter('')).toBe(true);
    expect(isSkippableFrontOrBackMatter('   ')).toBe(true);
  });

  it("treats the Gutenberg cover page's leaked <title> text as skippable", () => {
    // extractText() reads .textContent off the whole <html> element for
    // epub.js's normal Section.load() path, so Gutenberg's
    // `<title>"Cover"</title>` (an otherwise-empty cover wrapper document)
    // becomes the page's entire text.
    expect(isSkippableFrontOrBackMatter('"Cover"')).toBe(true);
  });

  it('treats other bare section-label pages as skippable', () => {
    expect(isSkippableFrontOrBackMatter('Contents')).toBe(true);
    expect(isSkippableFrontOrBackMatter('Index')).toBe(true);
  });

  it('treats Gutenberg running-title boilerplate residue as skippable', () => {
    // Leftover after stripGutenbergBoilerplate() cuts a page down to just
    // the running header that sat next to a marker.
    expect(
      isSkippableFrontOrBackMatter(
        'The Project Gutenberg eBook of Meditations, by Marcus Aurelius',
      ),
    ).toBe(true);
    expect(isSkippableFrontOrBackMatter('Phaedo, by Plato')).toBe(true);
  });

  it('does not treat a real short line of dialogue as skippable', () => {
    expect(isSkippableFrontOrBackMatter('Yes, indeed, said Cebes.')).toBe(
      false,
    );
  });

  it('does not treat a real one-line quote/poem as skippable', () => {
    expect(
      isSkippableFrontOrBackMatter('The unexamined life is not worth living.'),
    ).toBe(false);
  });

  it('does not treat a real narrative paragraph as skippable', () => {
    const paragraph =
      'PHAEDO By Plato Translated by Benjamin Jowett Contents ' +
      'INTRODUCTION. PHAEDO INTRODUCTION. After an interval of some ' +
      'months or years, and at Phlius, a town of Peloponnesus, the tale ' +
      'of the last hours of Socrates is narrated to Echecrates.';
    expect(isSkippableFrontOrBackMatter(paragraph)).toBe(false);
  });

  it('never throws for arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        expect(() => isSkippableFrontOrBackMatter(input)).not.toThrow();
      }),
    );
  });
});
