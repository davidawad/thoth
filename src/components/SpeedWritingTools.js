import nlp from 'compromise';

import TextParsingTools from './TextParsingTools';

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

// don't bother substituting very short words - they're rarely the problem
// and hyphenation/timing already special-cases short words elsewhere.
const MIN_WORD_LENGTH = 4;

// only content words are worth substituting - swapping a preposition or
// pronoun for a "simpler" one is either meaningless or grammatically unsafe.
const CONTENT_TAGS = {
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

// in-memory cache so re-processing the same text (e.g. toggling settings)
// doesn't repeatedly hit the network for words we've already resolved this
// session. Keyed by `${normalizedWord}::${category}` -> replacement|null.
const synonymCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Exposed for tests so each test can start from a clean cache.
function clearSynonymCache() {
  synonymCache.clear();
}

// Shape/tag-only eligibility check: is this term even worth normalizing and
// looking up? (Split from analyzeTermForCandidacy to keep each function's
// branch count low.)
function findSubstitutableCategory(term) {
  const text = term && term.text;

  if (!text || !ALPHA_ONLY.test(text) || text.length < MIN_WORD_LENGTH) {
    return null;
  }

  const tags = term.tags || [];

  if (tags.some((tag) => EXCLUDE_TAGS.includes(tag))) {
    return null;
  }

  return Object.keys(CONTENT_TAGS).find((cat) => tags.includes(cat)) || null;
}

// Figures out whether a compromise term is a good candidate for substitution,
// and if so, what "category" (part of speech) it should be substituted within.
function analyzeTermForCandidacy(term) {
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
function matchCase(original, replacement) {
  if (!original) {
    return replacement;
  }

  if (
    original === original.toUpperCase() &&
    original !== original.toLowerCase()
  ) {
    return replacement.toUpperCase();
  }

  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

// Fetches Datamuse results for a word under a given relation. Resolves to []
// (never rejects) on any failure - offline, timeout, non-200, malformed
// body, etc. This is an enhancement-only network call and must fail open.
//
// `relation` is a Datamuse query param: "rel_syn" (strict WordNet synonyms -
// high precision, but many words have none) or "ml" ("means like" - a much
// looser semantic-relatedness match, higher recall but includes non-synonym
// associations, e.g. "chef" ~ "kitchen"). We try rel_syn first and only fall
// back to ml, see resolveReplacement().
async function fetchDatamuseRelation(relation, word) {
  if (typeof fetch !== 'function') {
    return [];
  }

  let controller;
  let timeoutId;

  try {
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    }

    const url = `${DATAMUSE_ENDPOINT}?${relation}=${encodeURIComponent(
      word,
    )}&md=p&max=${MAX_CANDIDATES}`;

    const response = await fetch(
      url,
      controller ? { signal: controller.signal } : undefined,
    );

    if (!response || !response.ok) {
      return [];
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  } catch {
    // network failure, timeout/abort, JSON parse error, whatever - fail open.
    return [];
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// From a list of Datamuse results (each `{ word, score, tags }`), picks the
// first (highest relevance) candidate that: shares the original word's part
// of speech, and is itself a "familiar"/"easy" word per the existing
// Dale-Chall / Spache lists - that's what makes it actually simpler.
// A candidate word is usable if: it's a real alphabetic word distinct from
// the original, it matches the original's part of speech (when known), and
// it's itself familiar/easy per the existing readability wordlists.
function isUsableCandidate(result, originalLower, posTag) {
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

function pickBestSynonym(originalWord, datamuseResults, category) {
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
async function resolveReplacement(candidate) {
  if (synonymCache.has(candidate.key)) {
    return synonymCache.get(candidate.key);
  }

  const synonymResults = await fetchDatamuseRelation(
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
async function substituteText(text) {
  const fallback = { text, substitutions: [], changed: false };

  if (typeof text !== 'string' || text.trim().length === 0) {
    return fallback;
  }

  try {
    const doc = nlp(text);
    const sentences = doc.json();

    // Single pass: annotate every term with its substitution candidacy (or
    // null) up front, so the "gather unique words" pass and the "rebuild
    // text" pass can never disagree with each other.
    const annotated = sentences.map((sentence) =>
      sentence.terms.map((term) => ({
        term,
        candidate: analyzeTermForCandidacy(term),
      })),
    );

    const uniqueCandidates = new Map();

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

    await Promise.all(candidatesToResolve.map(resolveReplacement));

    const substitutions = [];
    const substitutionsByKey = new Map();

    let rebuilt = '';

    annotated.forEach((sentenceTerms) => {
      sentenceTerms.forEach(({ term, candidate }) => {
        let outputText = term.text;

        const replacement = candidate ? synonymCache.get(candidate.key) : null;

        if (candidate && replacement) {
          const cased = matchCase(term.text, replacement);
          outputText = cased;

          if (substitutionsByKey.has(candidate.key)) {
            substitutionsByKey.get(candidate.key).count += 1;
          } else {
            const entry = { original: term.text, replacement: cased, count: 1 };
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
  } catch {
    // speed writing is an enhancement - never let it break the base reading
    // experience.
    return fallback;
  }
}

const funcs = {
  substituteText,
  clearSynonymCache,
};

export default funcs;
