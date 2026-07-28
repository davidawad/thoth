import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import SpeedWritingTools from './SpeedWritingTools';

afterEach(() => {
  vi.unstubAllGlobals();
  SpeedWritingTools.clearSynonymCache();
});

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

describe('SpeedWritingTools.analyzeTermForCandidacy', () => {
  it('flags an unfamiliar word (in neither dictionary) as a candidate', () => {
    // "gorgeous" is confirmed absent from both dale-chall and spache.
    const candidate = SpeedWritingTools.analyzeTermForCandidacy({
      text: 'gorgeous',
      tags: ['Adjective'],
      normal: 'gorgeous',
    });

    expect(candidate).not.toBeNull();
    expect(candidate?.category).toBe('Adjective');
    expect(candidate?.normalized).toBe('gorgeous');
  });

  it('does not flag an already-familiar word as a candidate', () => {
    // "beautiful" is confirmed present in both dictionaries - nothing to
    // simplify.
    const candidate = SpeedWritingTools.analyzeTermForCandidacy({
      text: 'beautiful',
      tags: ['Adjective'],
      normal: 'beautiful',
    });

    expect(candidate).toBeNull();
  });
});

describe('SpeedWritingTools.isUsableCandidate', () => {
  it('rejects a result matching the original word (case-insensitively)', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: 'Gorgeous' },
        'gorgeous',
        undefined,
      ),
    ).toBe(false);
  });

  it('rejects a non-alphabetic result word', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: "can't" },
        'gorgeous',
        undefined,
      ),
    ).toBe(false);
  });

  it('rejects a result whose part of speech does not match the requested tag', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: 'beautiful', tags: ['v'] },
        'gorgeous',
        'adj',
      ),
    ).toBe(false);
  });

  it('rejects a result that is not itself familiar/easy', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: 'resplendent', tags: ['adj'] },
        'gorgeous',
        'adj',
      ),
    ).toBe(false);
  });

  it('accepts a distinct, matching-POS, dictionary-familiar result', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: 'beautiful', tags: ['adj'] },
        'gorgeous',
        'adj',
      ),
    ).toBe(true);
  });

  it('accepts regardless of POS when no posTag is known', () => {
    expect(
      SpeedWritingTools.isUsableCandidate(
        { word: 'beautiful', tags: ['v'] },
        'gorgeous',
        undefined,
      ),
    ).toBe(true);
  });
});

describe('SpeedWritingTools.pickBestSynonym', () => {
  it('returns the first usable candidate, skipping unusable ones', () => {
    const result = SpeedWritingTools.pickBestSynonym(
      'gorgeous',
      [
        { word: 'gorgeous' }, // rejected: matches original
        { word: "can't" }, // rejected: non-alphabetic
        { word: 'resplendent', tags: ['adj'] }, // rejected: not familiar
        { word: 'lovely', tags: ['adj'] }, // accepted
        { word: 'beautiful', tags: ['adj'] }, // never reached
      ],
      'Adjective',
    );

    expect(result).toBe('lovely');
  });

  it('returns null when no candidate is usable', () => {
    const result = SpeedWritingTools.pickBestSynonym(
      'gorgeous',
      [{ word: 'resplendent', tags: ['adj'] }],
      'Adjective',
    );

    expect(result).toBeNull();
  });
});

describe('SpeedWritingTools.substituteText', () => {
  it('resolves to the original text unchanged for empty/whitespace-only input', async () => {
    const result = await SpeedWritingTools.substituteText('   ');
    expect(result).toEqual({ text: '   ', substitutions: [], changed: false });
  });

  it('fails open (returns the original text) when fetch is unavailable', async () => {
    vi.stubGlobal('fetch', undefined);

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was breathtaking.',
    );

    expect(result.changed).toBe(false);
    expect(result.text).toBe('The gorgeous sunset was breathtaking.');
  });

  it('fails open when the Datamuse API call rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was breathtaking.',
    );

    expect(result.changed).toBe(false);
    expect(result.text).toBe('The gorgeous sunset was breathtaking.');
  });

  it('fails open (and aborts the request) when Datamuse never responds', async () => {
    let requestSignal: AbortSignal | undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined;
        // never resolves/rejects on its own - only the timeout should end this.
        return new Promise(() => {});
      }),
    );

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was breathtaking.',
    );

    expect(result.changed).toBe(false);
    expect(result.text).toBe('The gorgeous sunset was breathtaking.');
    // the timeout should have interrupted the underlying fetch via its
    // AbortSignal, not just abandoned the pending promise.
    expect(requestSignal?.aborted).toBe(true);
  }, 10000);

  it('substitutes a difficult word for a mocked Datamuse synonym and reports it', async () => {
    // "gorgeous" and "breathtaking" are both absent from the dictionaries,
    // so both are candidates; the mock returns the same synonym for every
    // lookup, so both get replaced with it.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ word: 'lovely', tags: ['adj', 'syn'] }]),
      }),
    );

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was pretty.',
    );

    expect(result.changed).toBe(true);
    expect(result.text).toContain('lovely');
    expect(result.text).not.toContain('gorgeous');
    expect(result.substitutions).toEqual([
      { original: 'gorgeous', replacement: 'lovely', count: 1 },
    ]);
  });

  it('leaves already-familiar text completely unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const result = await SpeedWritingTools.substituteText(
      'The big dog ran fast.',
    );

    expect(result.changed).toBe(false);
    expect(result.substitutions).toEqual([]);
    // No difficult words found, so Datamuse should never even be queried.
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('SpeedWritingTools.substituteText - Datamuse response handling', () => {
  it('treats a non-ok HTTP response as no synonyms found (fails open)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve([]) }),
    );

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was pretty.',
    );

    expect(result.changed).toBe(false);
  });

  it('treats a non-array JSON body as no synonyms found (fails open)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ unexpected: 'shape' }),
      }),
    );

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was pretty.',
    );

    expect(result.changed).toBe(false);
  });

  it('only queries Datamuse once per unique word across repeated calls (cache reuse)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ word: 'lovely', tags: ['adj', 'syn'] }]),
    });
    vi.stubGlobal('fetch', fetchMock);

    await SpeedWritingTools.substituteText('The gorgeous sunset was pretty.');
    const callsAfterFirst = fetchMock.mock.calls.length;

    await SpeedWritingTools.substituteText('A gorgeous dog ran fast.');

    // "gorgeous" was already resolved and cached by the first call - the
    // second call should reuse it rather than hitting the network again.
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('only queries the strict rel_syn relation - no "means like" fallback', async () => {
    // An earlier version also fell back to Datamuse's looser "means like"
    // relation when rel_syn had no hits, but that produced wrong-sense
    // substitutions no synonym API can disambiguate (e.g. "breezing
    // through it" -> "air", from the weather sense of "breeze" - see
    // resolveReplacement's comment). The fallback was removed; a word with
    // no strict synonym is now simply left unsubstituted, not guessed at.
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await SpeedWritingTools.substituteText(
      'The gorgeous sunset was pretty.',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('rel_syn=');
    expect(result.changed).toBe(false);
  });
});
