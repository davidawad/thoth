import nlp from "compromise";
import syllable from "syllable";
import daleChallWords from "dale-chall";
import daleChallFormula from "dale-chall-formula";
import colemanLiau from "coleman-liau";
import flesch from "flesch";
import smog from "smog-formula";
import gunningFog from "gunning-fog";
import spacheWords from "spache";
import spacheFormula from "spache-formula";
import ari from "automated-readability";
import unlerp from "unlerp";
import * as CONSTANTS from "./constants";


console.log("Spache words type:", typeof spacheWords);
console.log("Spache words:", spacheWords);

const scale = CONSTANTS.AGE_SCALE;

const punctuationRegEx =
  /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g;

// var max = Math.max
// var min = Math.min
var floor = Math.floor;
var round = Math.round;
var ceil = Math.ceil;
var sqrt = Math.sqrt;

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
function gradeToAge(grade) {
  return round(grade + 5);
}

// Calculate the age relating to a Flesch result.
function fleschToAge(value) {
  return 20 - floor(value / 10);
}

// Calculate the age relating to a SMOG result.
// See <http://www.readabilityformulas.com/smog-readability-formula.php>.
function smogToAge(value) {
  return ceil(sqrt(value) + 2.5);
}

// computes an object containing the number of sentences / etc.
const computeCounts = function computeStatsOnTextCorpus(text) {
  let ret = {};

  const langObj = nlp(text);

  let numSentences = langObj.sentences().length;

  let numWords = 0;
  let numCharacters = 0;
  let numSyllables = 0;
  let numPolySyllabicWords = 0; // polysyllabic (three or more syllables)
  let numComplexPolysillabicWords = 0;

  var familiarWords = {};
  var easyWord = {};
  var familiarWordCount = 0;
  let easyWordCount = 0;

  // to compute number of words and characters
  langObj
    .sentences()
    .data()
    .forEach((elem) => {
      let normalizedWords = elem.normal.split(" ");

      let numWordsThisSentence = normalizedWords.length;

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

          let firstLetter = w.charAt(0);

          // if the word is not a proper noun, it's considered "complex".
          // slightly over-eager way to measure this.
          if (firstLetter === firstLetter.toLowerCase()) {
            numComplexPolysillabicWords++;
          }
        }

        // Find easy words from spache.
        if (spacheWords.includes(w) && familiarWords[w] !== true) {
          // TODO do we need to build a hash table of the words? or do we only need the counts?
          easyWord[w] = true;
          easyWordCount++;
        }

        // Find familiar words for dale-chall.
        if (
          ((Array.isArray(daleChallWords) && daleChallWords.includes(w)) ||
            (typeof daleChallWords === "object" && w in daleChallWords)) &&
          easyWord[w] !== true
        ) {
          // TODO do we need to build a hash table of the words? or do we only need the counts?
          familiarWords[w] = true;
          familiarWordCount++;
        }
      });
    });

  let numLetters = numCharacters;

  ret = {
    character: numCharacters,
    letter: numLetters,
    syllable: numSyllables,
    word: numWords,
    polysillabicWord: numPolySyllabicWords,
    complexPolysillabicWord: numComplexPolysillabicWords,
    sentence: numSentences,
    unfamiliarWord: numWords - familiarWordCount,
    difficultWord: numWords - easyWordCount,
  };

  return ret;
};

// takes counts and returns the different reabability scores of all the items within it.
const generateScores = function computeReadabilityScoresBasedOnCounts(counts) {
  let ret = {};

  ret = {
    daleChall: gradeToAge(
      daleChallFormula.gradeLevel(daleChallFormula(counts))[1]
    ),
    automatedReadability: gradeToAge(ari(counts)),
    colemanLiau: gradeToAge(colemanLiau(counts)),
    flesch: fleschToAge(flesch(counts)),
    smog: smogToAge(smog(counts)),
    gunningFog: gradeToAge(gunningFog(counts)),
    spacheFormula: gradeToAge(spacheFormula(counts)),
  };

  return ret;
};

const generateWeight = function generateWeightFromScores(age, val) {
  const min = age;
  const max = age + scale;

  return unlerp(min, max, val);
};

// takes counts and returns the different readability scores of all the items within it.
// returns them in terms of age (in years).
const generateTextScores = function computeReadabilityScoresBasedOnText(text) {
  return generateScores(computeCounts(text));
};

// return true for words that are familiar
const familiarWord = function checkAgainstDaleChallDictionary(w) {
  if (Array.isArray(daleChallWords)) {
    return daleChallWords.includes(w);
  } else if (daleChallWords && typeof daleChallWords === "object") {
    return w in daleChallWords;
  }
  return false;
};

// Find easy words using spache.
const easyWord = function checkAgainstSpacheDictionary(w) {
  // Handle both array and object cases
  if (Array.isArray(spacheWords)) {
    return spacheWords.includes(w);
  } else if (spacheWords && typeof spacheWords === "object") {
    return w in spacheWords;
  }
  return false;
};

/*

stripPunctuation("This., -/ is #! an $ % ^ & * example ;: {} of a = -_ string with `~)() punctuation")
returns
This is an example of a string with punctuation
*/
const stripPunctuation = function stripAllFormattingChars(string) {
  return string.replace(punctuationRegEx, "").replace(/(\s){2,}/g, "$1");
};

const funcs = {
  computeCounts,
  generateScores,
  generateTextScores,
  generateWeight,
  easyWord,
  familiarWord,
  stripPunctuation,
};
export default funcs;
