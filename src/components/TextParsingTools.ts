// All of these except compromise/unlerp are ESM-only packages with named
// exports (no default) - importing them as default silently resolves to
// undefined under Next.js's bundler and crashes at call time.
import nlp from 'compromise';
import { syllable } from 'syllable';
import { daleChall as daleChallWords } from 'dale-chall';
import { daleChallFormula, daleChallGradeLevel } from 'dale-chall-formula';
import { colemanLiau } from 'coleman-liau';
import { flesch } from 'flesch';
import { smogFormula as smog } from 'smog-formula';
import { gunningFog } from 'gunning-fog';
import { spache as spacheWords } from 'spache';
import { spacheFormula } from 'spache-formula';
import { automatedReadability as ari } from 'automated-readability';
import unlerp from 'unlerp';
import * as CONSTANTS from './constants';

const scale = CONSTANTS.AGE_SCALE;

const punctuationRegEx =
  /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g;

const floor = Math.floor;
const round = Math.round;
const ceil = Math.ceil;
const sqrt = Math.sqrt;

export interface TextCounts {
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

export interface ReadabilityScores {
  daleChall: number;
  automatedReadability: number;
  colemanLiau: number;
  flesch: number;
  smog: number;
  gunningFog: number;
  spacheFormula: number;
  lexicalDensity: number;
}

export type ReadabilityMetricKey = 'average' | keyof ReadabilityScores;

export interface ReadabilityMetricOption {
  key: ReadabilityMetricKey;
  label: string;
}

// polysillabic (three or more syllables)

// https://en.wikipedia.org/wiki/Automated_readability_index

//  syllables
// https://github.com/words/syllable

// dale chall
// https://github.com/words/dale-chall-formula

// daleChallFormula({word: 30, sentence: 2, difficultWord: 6}) // => 4.41208

// Calculate the typical starting age (on the higher-end) when someone joins
// `grade` grade, in the US.
// See <https://en.wikipedia.org/wiki/Educational_stage#United_States>.
function gradeToAge(grade: number): number {
  return round(grade + 5);
}

// Calculate the age relating to a Flesch result.
function fleschToAge(value: number): number {
  return 20 - floor(value / 10);
}

// Calculate the age relating to a SMOG result.
// See <http://www.readabilityformulas.com/smog-readability-formula.php>.
function smogToAge(value: number): number {
  return ceil(sqrt(value) + 2.5);
}

// Calculate the age relating to a lexical density ratio (proportion of
// content words - nouns/verbs/adjectives/adverbs - to total words).
// Linearly maps the configured density range onto the configured age range.
function lexicalDensityToAge(density: number): number {
  const minDensity = CONSTANTS.MIN_LEXICAL_DENSITY;
  const maxDensity = CONSTANTS.MAX_LEXICAL_DENSITY;
  const minAge = CONSTANTS.LEXICAL_DENSITY_MIN_AGE;
  const maxAge = CONSTANTS.LEXICAL_DENSITY_MAX_AGE;

  const clamped = Math.min(Math.max(density, minDensity), maxDensity);
  const ratio = (clamped - minDensity) / (maxDensity - minDensity);

  return minAge + ratio * (maxAge - minAge);
}

// computes an object containing the number of sentences / etc.
const computeCounts = function computeStatsOnTextCorpus(
  text: string,
): TextCounts {
  const langObj = nlp(text);

  const numSentences = langObj.sentences().length;

  let numWords = 0;
  let numCharacters = 0;
  let numSyllables = 0;
  let numPolySyllabicWords = 0; // polysyllabic (three or more syllables)
  let numComplexPolysillabicWords = 0;

  const familiarWords: Record<string, boolean> = {};
  const easyWord: Record<string, boolean> = {};
  let familiarWordCount = 0;
  let easyWordCount = 0;

  // to compute number of words and characters
  langObj
    .sentences()
    .data()
    .forEach((elem) => {
      // Normalized forms live per-term, not on the sentence itself.
      const normalizedWords = elem.terms.map((t) => t.normal);

      const numWordsThisSentence = normalizedWords.length;

      numWords += numWordsThisSentence;

      // process each normalized word.
      normalizedWords.forEach((w) => {
        numCharacters += w.length;

        // find number of syllables per word.
        const numSyllablesThisWord = syllable(w);

        numSyllables += numSyllablesThisWord;

        // if this word is polysyllabic, increment the count
        if (numSyllablesThisWord >= 3) {
          numPolySyllabicWords++;

          const firstLetter = w.charAt(0);

          // if the word is not a proper noun, it's considered "complex".
          // slightly over-eager way to measure this.
          if (firstLetter === firstLetter.toLowerCase()) {
            numComplexPolysillabicWords++;
          }
        }

        // Find easy words from spache.
        if (spacheWords.includes(w) && familiarWords[w] !== true) {
          easyWord[w] = true;
          easyWordCount++;
        }

        // Find familiar words for dale-chall.
        if (daleChallWords.includes(w) && easyWord[w] !== true) {
          familiarWords[w] = true;
          familiarWordCount++;
        }
      });
    });

  const numLetters = numCharacters;

  // Content words (nouns, verbs, adjectives, adverbs) via compromise's POS
  // tagging - used to compute lexical density, a free extra difficulty
  // signal (see lexicalDensityToAge below).
  const numContentWords =
    langObj.nouns().length +
    langObj.verbs().length +
    langObj.adjectives().length +
    langObj.adverbs().length;

  return {
    character: numCharacters,
    letter: numLetters,
    syllable: numSyllables,
    word: numWords,
    polysillabicWord: numPolySyllabicWords,
    complexPolysillabicWord: numComplexPolysillabicWords,
    sentence: numSentences,
    unfamiliarWord: numWords - familiarWordCount,
    difficultWord: numWords - easyWordCount,
    contentWord: numContentWords,
  };
};

// takes counts and returns the different reabability scores of all the items within it.
const generateScores = function computeReadabilityScoresBasedOnCounts(
  counts: TextCounts,
): ReadabilityScores {
  return {
    daleChall: gradeToAge(daleChallGradeLevel(daleChallFormula(counts))[1]),
    automatedReadability: gradeToAge(ari(counts)),
    colemanLiau: gradeToAge(colemanLiau(counts)),
    flesch: fleschToAge(flesch(counts)),
    smog: smogToAge(smog(counts)),
    gunningFog: gradeToAge(gunningFog(counts)),
    spacheFormula: gradeToAge(spacheFormula(counts)),
    lexicalDensity: lexicalDensityToAge(
      counts.word > 0 ? counts.contentWord / counts.word : 0,
    ),
  };
};

// The set of difficulty/readability metrics a user can pick between to
// drive the age estimate + word timing, and the human-readable labels for
// them - single source of truth for the SettingsPanel combobox. Keys must
// match the keys generateScores() returns, plus the synthetic "average"
// option (mean of every finite metric - the long-standing default).
const READABILITY_METRICS: ReadabilityMetricOption[] = [
  { key: 'average', label: 'Average of all metrics' },
  { key: 'daleChall', label: 'Dale-Chall' },
  { key: 'spacheFormula', label: 'Spache' },
  { key: 'flesch', label: 'Flesch-Kincaid' },
  { key: 'smog', label: 'SMOG' },
  { key: 'gunningFog', label: 'Gunning Fog' },
  { key: 'colemanLiau', label: 'Coleman-Liau' },
  { key: 'automatedReadability', label: 'Automated Readability Index' },
  { key: 'lexicalDensity', label: 'Lexical Density (POS-based)' },
];

const generateWeight = function generateWeightFromScores(
  age: number,
  val: number,
): number {
  const min = age;
  const max = age + scale;

  return unlerp(min, max, val);
};

// takes counts and returns the different readability scores of all the items within it.
// returns them in terms of age (in years).
const generateTextScores = function computeReadabilityScoresBasedOnText(
  text: string,
): ReadabilityScores {
  return generateScores(computeCounts(text));
};

// Check whether a word appears in a readability dictionary (a plain array
// of familiar/easy words, per how dale-chall/spache ship theirs).
const wordInDictionary = function wordInDictionary(
  dictionary: string[],
  w: string,
): boolean {
  return dictionary.includes(w);
};

// return true for words that are familiar (dale-chall dictionary)
const familiarWord = function checkAgainstDaleChallDictionary(
  w: string,
): boolean {
  return wordInDictionary(daleChallWords, w);
};

// Find easy words using spache.
const easyWord = function checkAgainstSpacheDictionary(w: string): boolean {
  return wordInDictionary(spacheWords, w);
};

// Continuous, graduated per-word display-time multiplier - replaces the old
// fixed "unfamiliar word gets 1.5x/2.5x time" binary flag (paper §8.1 Future
// Work explicitly calls this out as losing gradations of difficulty).
// Combines two free per-word signals:
//   - syllable count: longer words take more of the multiplier
//   - dictionary familiarity tier: words absent from spache (the easier,
//     younger-reader list) AND dale-chall (the general familiar list) are
//     treated as harder than words that are unfamiliar in only one.
// All weights are tunable constants (see constants.ts), not hardcoded here.
const wordDifficultyMultiplier = function computeWordDifficultyMultiplier(
  word: string,
): number {
  const stripped = stripPunctuation(word).toLowerCase();

  if (!stripped) {
    return CONSTANTS.DIFFICULTY_BASE_MULTIPLIER;
  }

  const syllableCount = syllable(stripped);
  const extraSyllables = Math.max(0, syllableCount - 1);

  const isEasy = easyWord(stripped);
  const isFamiliar = familiarWord(stripped);

  let familiarityPenalty = 0;

  if (!isEasy && !isFamiliar) {
    // unfamiliar in both dictionaries - hardest tier
    familiarityPenalty =
      CONSTANTS.DIFFICULTY_UNFAMILIAR_WEIGHT + CONSTANTS.DIFFICULTY_HARD_WEIGHT;
  } else if (!isEasy && isFamiliar) {
    // generally familiar, but not on the "easy" (spache) list - middle tier
    familiarityPenalty = CONSTANTS.DIFFICULTY_UNFAMILIAR_WEIGHT;
  }
  // else: on the easy (spache) list - easiest tier, no penalty

  const multiplier =
    CONSTANTS.DIFFICULTY_BASE_MULTIPLIER +
    extraSyllables * CONSTANTS.DIFFICULTY_SYLLABLE_WEIGHT +
    familiarityPenalty;

  return Math.min(multiplier, CONSTANTS.MAX_DIFFICULTY_MULTIPLIER);
};

/*

stripPunctuation("This., -/ is #! an $ % ^ & * example ;: {} of a = -_ string with `~)() punctuation")
returns
This is an example of a string with punctuation
*/
const stripPunctuation = function stripAllFormattingChars(
  text: string,
): string {
  return text.replace(punctuationRegEx, '').replace(/(\s){2,}/g, '$1');
};

const funcs = {
  computeCounts,
  generateScores,
  generateTextScores,
  generateWeight,
  easyWord,
  familiarWord,
  stripPunctuation,
  wordDifficultyMultiplier,
  READABILITY_METRICS,
  // Exported in addition to the above purely so property tests can exercise
  // them directly - not otherwise part of the module's public surface.
  gradeToAge,
  fleschToAge,
  smogToAge,
  lexicalDensityToAge,
  wordInDictionary,
};
export default funcs;
