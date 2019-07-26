import nlp from 'compromise';
import syllable from 'syllable';
import daleChall from 'dale-chall';
import daleChallFormula from 'dale-chall-formula';
import colemanLiau from 'coleman-liau';
import flesch from 'flesch';
import smog from 'smog-formula';
import gunningFog from 'gunning-fog';
import spache from 'spache';
import spacheFormula from 'spache-formula';
import ari from 'automated-readability'; 
import unlerp from 'unlerp';
import * as CONSTANTS from './constants';

const scale = CONSTANTS.AGE_SCALE;


// var max = Math.max
// var min = Math.min
var floor = Math.floor
var round = Math.round
var ceil = Math.ceil
var sqrt = Math.sqrt


// polysillabic (three or more syllables) 


// https://en.wikipedia.org/wiki/Automated_readability_index


    //  syllables 
    // https://github.com/words/syllable


    // dale chall 
    // https://github.com/words/dale-chall-formula
    // var daleChallFormula = require('dale-chall-formula')

    // daleChallFormula({word: 30, sentence: 2, difficultWord: 6}) // => 4.41208


// Calculate the typical starting age (on the higher-end) when someone joins
// `grade` grade, in the US.
// See <https://en.wikipedia.org/wiki/Educational_stage#United_States>.
function gradeToAge(grade) {
    return round(grade + 5)
}

// Calculate the age relating to a Flesch result.
function fleschToAge(value) {
    return 20 - floor(value / 10)
}

// Calculate the age relating to a SMOG result.
// See <http://www.readabilityformulas.com/smog-readability-formula.php>.
function smogToAge(value) {
    return ceil(sqrt(value) + 2.5)
}


// computes an object containing the number of sentences / etc. 
const computeCounts = function computeStatsOnTextCorpus(text) {

    let ret = { };


    const langObj = nlp(text)
    
    let numSentences = langObj.sentences().length; 

    let numWords = 0;
    let numCharacters = 0;
    let numSyllables = 0;
    let numPolySyllabicWords = 0; // polysyllabic (three or more syllables) 
    let numComplexPolysillabicWords = 0;

    var familiarWords = {}
    var easyWord = {}
    var familiarWordCount = 0;
    let easyWordCount = 0;

    // to compute number of words and characters
    langObj.sentences().data().forEach((elem) => {
        
        let normalizedWords = elem.normal.split(" ");
        
        let numWordsThisSentence = normalizedWords.length;

        numWords += numWordsThisSentence;

        // process each normalized word. 
        normalizedWords.forEach((w) => {

            numCharacters += w.length

            // find number of syllables per word.
            const numSyllablesThisWord = syllable(w);

            numSyllables += numSyllablesThisWord;
            
            // if this word is polysyllabic, increment the count
            if (numSyllablesThisWord >= 3) { 

                numPolySyllabicWords ++ 

                let firstLetter = w.charAt(0);

                // if the word is not a proper noun, it's considered "complex". 
                // slightly over-eager way to measure this.
                if (firstLetter === firstLetter.toLowerCase()) {
                  numComplexPolysillabicWords++
                }
            }

            // Find easy words from spache.
            if (spache.indexOf(w) !== -1 && familiarWords[w] !== true) {
                // TODO do we need to build a hash table of the words? or do we only need the counts? 
                easyWord[w] = true;
                easyWordCount++;
            }

            // Find familiar words for dale-chall.
            if (daleChall.indexOf(w) !== -1 && easyWord[w] !== true) {
                // TODO do we need to build a hash table of the words? or do we only need the counts? 
                familiarWords[w] = true;
                familiarWordCount++;
            }

        })

    })

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
}



// takes counts and returns the different reabability scores of all the items within it. 
const generateScores = function computeReadabilityScoresBasedOnCounts(counts) {

    let ret = {}

    ret = {
        daleChall : gradeToAge(daleChallFormula.gradeLevel(daleChallFormula(counts))[1]),
        automatedReadability: gradeToAge(ari(counts)),
        colemanLiau: gradeToAge(colemanLiau(counts)),
        flesch: fleschToAge(flesch(counts)),
        smog: smogToAge(smog(counts)),
        gunningFog: gradeToAge(gunningFog(counts)),
        spacheFormula: gradeToAge(spacheFormula(counts))
    }

    return ret;
}


const generateWeight = function generateWeightFromScores(age, val) {

    const min = age;
    const max = age + scale;

    return unlerp(min, max, val);
}


// takes counts and returns the different readability scores of all the items within it. 
// returns them in terms of age (in years). 
const generateTextScores = function computeReadabilityScoresBasedOnText(text) {
    return generateScores(computeCounts(text));
}


// return true for words that are familiar
const familiarWord = function checkAgainstDaleChallDictionary(w) {

    if (daleChall.indexOf(w) !== -1) {
        return true;
    }

    return false;
}


// Find easy words using spache.
const easyWord = function checkAgainstSpacheDictionary(w) {
    
    if (spache.indexOf(w) !== -1) {
        return true;
    }
    
    return false;
}


const funcs = { computeCounts, generateScores, generateTextScores, generateWeight, easyWord, familiarWord };
export default funcs;