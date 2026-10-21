import nlp from 'compromise';
import { syllable } from 'syllable';
import { daleChall as daleChallWords } from 'dale-chall';
import { daleChallFormula, daleChallGradeLevel } from 'dale-chall-formula';
import { colemanLiau } from 'coleman-liau';
import { flesch } from 'flesch';
import { smogFormula } from 'smog-formula';
import { gunningFog } from 'gunning-fog';
import { spache as spacheWords } from 'spache';
import { spacheFormula } from 'spache-formula';
import { automatedReadability } from 'automated-readability';
import * as CONSTANTS from '../constants';
import type { Scorer } from './scorers';
import { scorerRegistry } from './scorers';

interface SentenceCounts {
  character: number;
  letter: number;
  syllable: number;
  word: number;
  polysillabicWord: number;
  complexPolysillabicWord: number;
  sentence: number;
  unfamiliarWord: number;
  difficultWord: number;
  contentWord: number;
}

function countsForSentence(sentence: string): SentenceCounts {
  const doc = nlp(sentence);
  const words = doc
    .sentences()
    .data()
    .flatMap((part) => part.terms.map((term) => term.normal));
  let syllables = 0;
  let polysyllabic = 0;
  let complex = 0;
  for (const word of words) {
    const count = syllable(word);
    syllables += count;
    if (count >= 3) {
      polysyllabic++;
      if (word[0] === word[0]?.toLowerCase()) complex++;
    }
  }
  const spacheCount = words.filter((word) => spacheWords.includes(word)).length;
  const daleCount = words.filter(
    (word) => daleChallWords.includes(word) && !spacheWords.includes(word),
  ).length;
  const contentWord =
    doc.nouns().length +
    doc.verbs().length +
    doc.adjectives().length +
    doc.adverbs().length;
  const characters = words.reduce((sum, word) => sum + word.length, 0);
  return {
    character: characters,
    letter: characters,
    syllable: syllables,
    word: words.length,
    polysillabicWord: polysyllabic,
    complexPolysillabicWord: complex,
    sentence: 1,
    unfamiliarWord: words.length - daleCount,
    difficultWord: words.length - spacheCount,
    contentWord,
  };
}

function toMultiplier(age: number): number {
  const boundedAge = Math.min(CONSTANTS.MAX_AGE, Math.max(0, age));
  const raw = 1 + (boundedAge - CONSTANTS.DEFAULT_AGE) / CONSTANTS.AGE_SCALE;
  return Math.max(
    CONSTANTS.SENTENCE_PACING_MIN_MULTIPLIER,
    Math.min(CONSTANTS.SENTENCE_PACING_MAX_MULTIPLIER, raw),
  );
}

function gradeToAge(grade: number): number {
  return Math.round(grade + 5);
}
function fleschToAge(value: number): number {
  return 20 - Math.floor(value / 10);
}
function smogToAge(value: number): number {
  return Math.ceil(Math.sqrt(value) + 2.5);
}
function lexicalAge(counts: SentenceCounts): number {
  const min = CONSTANTS.MIN_LEXICAL_DENSITY;
  const max = CONSTANTS.MAX_LEXICAL_DENSITY;
  const ratio = Math.min(
    1,
    Math.max(
      0,
      ((counts.word ? counts.contentWord / counts.word : 0) - min) /
        (max - min),
    ),
  );
  return (
    CONSTANTS.LEXICAL_DENSITY_MIN_AGE +
    ratio *
      (CONSTANTS.LEXICAL_DENSITY_MAX_AGE - CONSTANTS.LEXICAL_DENSITY_MIN_AGE)
  );
}

type AgeFormula = (counts: SentenceCounts) => number;
function makeScorer(id: string, formula: AgeFormula): Scorer {
  return {
    id,
    granularity: 'sentence',
    score: () => 1,
    scoreSentence: (sentence) =>
      toMultiplier(formula(countsForSentence(sentence))),
  };
}

// SMOG was calibrated across at least 30 sentences. A single sentence cannot
// supply that sample, so scale its polysyllabic count to a 30-sentence
// equivalent before applying the published formula. This is explicitly an
// approximation and is noisy for very short sentences.
const scorers: Scorer[] = [
  makeScorer('fleschReadingEase', (c) => fleschToAge(flesch(c))),
  makeScorer('gunningFog', (c) => gradeToAge(gunningFog(c))),
  makeScorer('smog', (c) =>
    smogToAge(
      smogFormula({
        ...c,
        polysillabicWord: c.polysillabicWord * 30,
        sentence: 30,
      }),
    ),
  ),
  makeScorer('colemanLiau', (c) => gradeToAge(colemanLiau(c))),
  makeScorer('automatedReadability', (c) =>
    gradeToAge(automatedReadability(c)),
  ),
  makeScorer('daleChall', (c) =>
    gradeToAge(daleChallGradeLevel(daleChallFormula(c))[1]),
  ),
  makeScorer('spache', (c) => gradeToAge(spacheFormula(c))),
  makeScorer('lexicalDensity', lexicalAge),
];

for (const scorer of scorers) scorerRegistry.register(scorer);

export const formulaScorers = scorers;
