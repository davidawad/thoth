import nlp from 'compromise';
import type { CompromiseTerm } from 'compromise';
import { Duration, Effect } from 'effect';

import TextParsingTools from './TextParsingTools';
import { datamuseResponseSchema } from './schemas';

/*
Speed Writing (paper §8.4 "Speed Writing" future work).

Given a chunk of text, finds "difficult" words (words that are NOT in the
Dale-Chall / Spache familiar-word lists that TextParsingTools already uses to
score readability) and looks up simpler, familiar synonyms for them using the
free Datamuse "means like" API (https://api.datamuse.com/words?ml=<word>).

This is an *opt-in enhancement*. It must never throw, never hang the reader,
and never silently mutate anything the caller didn't ask for - every function
here resolves to a safe fallback (the original, unmodified text) if anything
goes wrong (offline, slow network, malformed response, etc).
*/

const DATAMUSE_ENDPOINT = 'https://api.datamuse.com/words';

// how long we're willing to wait on a single Datamuse lookup before giving up on it.
const FETCH_TIMEOUT_MS = 2500;

// how many synonym candidates to request per word.
const MAX_CANDIDATES = 8;

// hard cap on how many *unique* difficult words we'll look up per call, so a
// giant pasted text can't hammer the free API or stall the reader.
const MAX_LOOKUPS = 60;

// how many of those lookups are allowed to be in flight at once. Previously
// unbounded (a single Promise.all over every candidate) - capped now that
// Effect.all makes a concurrency limit a one-line change, so a long text
// with many difficult words can't fire dozens of simultaneous requests at
// Datamuse's free, rate-limited API.
const MAX_CONCURRENT_LOOKUPS = 8;

// don't bother substituting very short words - they're rarely the problem
// and hyphenation/timing already special-cases short words elsewhere.
const MIN_WORD_LENGTH = 4;

type ContentCategory = 'Noun' | 'Verb' | 'Adjective' | 'Adverb';

// only content words are worth substituting - swapping a preposition or
// pronoun for a "simpler" one is either meaningless or grammatically unsafe.
const CONTENT_TAGS: Record<ContentCategory, string> = {
  Noun: 'n',
  Verb: 'v',
  Adjective: 'adj',
  Adverb: 'adv',
};

// tags that mean "don't touch this term" regardless of its content category -
// proper nouns, numbers, hyphenated compounds (substituting half of a
// compound word produces nonsense), urls, etc.
const EXCLUDE_TAGS = [
  'ProperNoun',
  'Hyphenated',
  'Value',
  'Url',
  'Acronym',
  'Abbreviation',
  'Currency',
  'Emoji',
  'Emoticon',
  'HashTag',
  'AtMention',
];

const ALPHA_ONLY = /^[A-Za-z]+$/;

interface Candidate {
  key: string;
  normalized: string;
  category: ContentCategory;
}

export interface Substitution {
  original: string;
  replacement: string;
  count: number;
}

export interface SubstitutionResult {
  text: string;
  substitutions: Substitution[];
  changed: boolean;
}

interface DatamuseResult {
  word: string;
  score?: number | undefined;
  tags?: string[] | undefined;
}

// in-memory cache so re-processing the same text (e.g. toggling settings)
// doesn't repeatedly hit the network for words we've already resolved this
// session. Keyed by `${normalizedWord}::${category}` -> replacement|null.
const synonymCache = new Map<string, string | null>();
const MAX_CACHE_SIZE = 1000;

// Exposed for tests so each test can start from a clean cache.
function clearSynonymCache(): void {
  synonymCache.clear();
}

// Shape/tag-only eligibility check: is this term even worth normalizing and
// looking up? (Split from analyzeTermForCandidacy to keep each function's
// branch count low.)
function findSubstitutableCategory(
  term: CompromiseTerm,
): ContentCategory | null {
  const text = term && term.text;

  if (!text || !ALPHA_ONLY.test(text) || text.length < MIN_WORD_LENGTH) {
    return null;
  }

  const tags = term.tags || [];

  if (tags.some((tag) => EXCLUDE_TAGS.includes(tag))) {
    return null;
  }

  const found = (Object.keys(CONTENT_TAGS) as ContentCategory[]).find((cat) =>
    tags.includes(cat),
  );

  return found || null;
}

// Figures out whether a compromise term is a good candidate for substitution,
// and if so, what "category" (part of speech) it should be substituted within.
function analyzeTermForCandidacy(term: CompromiseTerm): Candidate | null {
  const category = findSubstitutableCategory(term);

  if (!category) {
    return null;
  }

  const normalized = TextParsingTools.stripPunctuation(term.text).toLowerCase();

  if (!normalized) {
    return null;
  }

  // already a familiar/easy word per the existing readability wordlists -
  // nothing to simplify.
  if (
    TextParsingTools.familiarWord(normalized) ||
    TextParsingTools.easyWord(normalized)
  ) {
    return null;
  }

  return {
    key: `${normalized}::${category}`,
    normalized,
    category,
  };
}

// Preserve the original word's casing on the replacement (Title Case,
// UPPERCASE, or lowercase).
function matchCase(original: string, replacement: string): string {
  if (!original) {
    return replacement;
  }

  if (
    original === original.toUpperCase() &&
    original !== original.toLowerCase()
  ) {
    return replacement.toUpperCase();
  }

  if (original[0] === original[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

// Fetches Datamuse results for a word under a given relation, as an Effect
// that always succeeds with [] (never fails) on any problem - offline,
// timeout, non-200, malformed body, whatever. This is an enhancement-only
// network call and must fail open.
//
// `relation` is a Datamuse query param: "rel_syn" (strict WordNet synonyms -
// high precision, but many words have none) or "ml" ("means like" - a much
// looser semantic-relatedness match, higher recall but includes non-synonym
// associations, e.g. "chef" ~ "kitchen"). We try rel_syn first and only fall
// back to ml, see resolveReplacementEffect().
//
// Effect.tryPromise's `try` callback receives an AbortSignal that Effect
// itself aborts on interruption - wiring Effect.timeout's cancellation
// straight through to the underlying fetch() call, for free. That replaces
// the AbortController + setTimeout + try/finally bookkeeping the previous
// Promise-based version needed to get the same behavior.
function fetchDatamuseRelationEffect(
  relation: string,
  word: string,
): Effect.Effect<DatamuseResult[]> {
  if (typeof fetch !== 'function') {
    return Effect.succeed([]);
  }

  const url = `${DATAMUSE_ENDPOINT}?${relation}=${encodeURIComponent(
    word,
  )}&md=p&max=${MAX_CANDIDATES}`;

  const program = Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: (signal) => fetch(url, { signal }),
      catch: () => 'fetch-failed' as const,
    });

    if (!response.ok) {
      return [] as DatamuseResult[];
    }

    const data: unknown = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: () => 'invalid-json' as const,
    });

    const parsed = datamuseResponseSchema.safeParse(data);

    return parsed.success ? parsed.data : [];
  });

  return program.pipe(
    Effect.timeout(Duration.millis(FETCH_TIMEOUT_MS)),
    // network failure, timeout, non-JSON body, whatever - fail open.
    Effect.catchAll(() => Effect.succeed([] as DatamuseResult[])),
  );
}

// From a list of Datamuse results (each `{ word, score, tags }`), picks the
// first (highest relevance) candidate that: shares the original word's part
// of speech, and is itself a "familiar"/"easy" word per the existing
// Dale-Chall / Spache lists - that's what makes it actually simpler.
// A candidate word is usable if: it's a real alphabetic word distinct from
// the original, it matches the original's part of speech (when known), and
// it's itself familiar/easy per the existing readability wordlists.
function isUsableCandidate(
  result: DatamuseResult,
  originalLower: string,
  posTag: string | undefined,
): boolean {
  const word = typeof result.word === 'string' ? result.word.toLowerCase() : '';

  if (!word || !ALPHA_ONLY.test(word) || word === originalLower) {
    return false;
  }

  const tags = Array.isArray(result.tags) ? result.tags : [];

  if (posTag && !tags.includes(posTag)) {
    return false;
  }

  return TextParsingTools.familiarWord(word) || TextParsingTools.easyWord(word);
}

function pickBestSynonym(
  originalWord: string,
  datamuseResults: DatamuseResult[],
  category: ContentCategory,
): string | null {
  const posTag = CONTENT_TAGS[category];
  const originalLower = originalWord.toLowerCase();

  const match = datamuseResults.find((result) =>
    isUsableCandidate(result, originalLower, posTag),
  );

  return match ? match.word.toLowerCase() : null;
}

// Resolves (looks up + picks) a replacement for a single candidate, using/
// populating the shared cache. Only trusts strict WordNet synonyms
// (Datamuse's `rel_syn` relation) - an earlier version also fell back to
// the looser "means like" relation (even filtered to results Datamuse
// itself tags "syn"), but that still produced wrong-sense substitutions
// for words used idiomatically (e.g. "breezing through it" -> "air",
// pulled from the weather sense of "breeze" - Datamuse has no way to know
// which sense of a word is meant in context). No synonym-API relation
// solves word-sense disambiguation, so the safer tradeoff is fewer
// substitutions (words with no strict synonym are simply left alone)
// rather than confident-looking wrong ones.
function resolveReplacementEffect(
  candidate: Candidate,
): Effect.Effect<string | null> {
  return Effect.gen(function* () {
    if (synonymCache.has(candidate.key)) {
      return synonymCache.get(candidate.key) ?? null;
    }

    const synonymResults = yield* fetchDatamuseRelationEffect(
      'rel_syn',
      candidate.normalized,
    );

    const replacement = pickBestSynonym(
      candidate.normalized,
      synonymResults,
      candidate.category,
    );

    if (synonymCache.size < MAX_CACHE_SIZE) {
      synonymCache.set(candidate.key, replacement);
    }

    return replacement;
  });
}

interface AnnotatedTerm {
  term: CompromiseTerm;
  candidate: Candidate | null;
}

/*
Main entry point. Takes raw text, returns a Promise that ALWAYS resolves
(never rejects) to:

  {
    text: string,          // the (possibly) simplified text
    substitutions: [{ original, replacement, count }],
    changed: boolean,       // true iff at least one substitution was made
  }

If speed writing can't do anything useful (empty text, no difficult words,
Datamuse unreachable, etc) it resolves to the original text unchanged with an
empty substitutions list - callers should always be able to just use
`result.text` as a drop-in replacement for the original.
*/
async function substituteText(text: string): Promise<SubstitutionResult> {
  const fallback: SubstitutionResult = {
    text,
    substitutions: [],
    changed: false,
  };

  if (typeof text !== 'string' || text.trim().length === 0) {
    return fallback;
  }

  const program = Effect.gen(function* () {
    const doc = nlp(text);
    const sentences = doc.json();

    // Single pass: annotate every term with its substitution candidacy (or
    // null) up front, so the "gather unique words" pass and the "rebuild
    // text" pass can never disagree with each other.
    const annotated: AnnotatedTerm[][] = sentences.map((sentence) =>
      sentence.terms.map((term) => ({
        term,
        candidate: analyzeTermForCandidacy(term),
      })),
    );

    const uniqueCandidates = new Map<string, Candidate>();

    annotated.forEach((sentenceTerms) => {
      sentenceTerms.forEach(({ candidate }) => {
        if (candidate && !uniqueCandidates.has(candidate.key)) {
          uniqueCandidates.set(candidate.key, candidate);
        }
      });
    });

    if (uniqueCandidates.size === 0) {
      return fallback;
    }

    const candidatesToResolve = Array.from(uniqueCandidates.values()).slice(
      0,
      MAX_LOOKUPS,
    );

    // Resolves every candidate concurrently, capped at
    // MAX_CONCURRENT_LOOKUPS in flight at once (see its definition) rather
    // than the unbounded Promise.all the Promise-based version used.
    yield* Effect.all(candidatesToResolve.map(resolveReplacementEffect), {
      concurrency: MAX_CONCURRENT_LOOKUPS,
    });

    const substitutions: Substitution[] = [];
    const substitutionsByKey = new Map<string, Substitution>();

    let rebuilt = '';

    annotated.forEach((sentenceTerms) => {
      sentenceTerms.forEach(({ term, candidate }) => {
        let outputText = term.text;

        const replacement = candidate ? synonymCache.get(candidate.key) : null;

        if (candidate && replacement) {
          const cased = matchCase(term.text, replacement);
          outputText = cased;

          const existing = substitutionsByKey.get(candidate.key);

          if (existing) {
            existing.count += 1;
          } else {
            const entry: Substitution = {
              original: term.text,
              replacement: cased,
              count: 1,
            };
            substitutionsByKey.set(candidate.key, entry);
            substitutions.push(entry);
          }
        }

        rebuilt += (term.pre || '') + outputText + (term.post || '');
      });
    });

    if (substitutions.length === 0) {
      return fallback;
    }

    return { text: rebuilt, substitutions, changed: true };
  }).pipe(
    // speed writing is an enhancement - never let it break the base reading
    // experience, regardless of what fails (compromise throwing on
    // pathological input, an unexpected Effect failure, etc).
    Effect.catchAll(() => Effect.succeed(fallback)),
  );

  return Effect.runPromise(program);
}

const funcs = {
  substituteText,
  clearSynonymCache,
  // Exported in addition to the above purely so property tests can exercise
  // them directly - not otherwise part of the module's public surface.
  matchCase,
  findSubstitutableCategory,
  analyzeTermForCandidacy,
  isUsableCandidate,
  pickBestSynonym,
};

export default funcs;
