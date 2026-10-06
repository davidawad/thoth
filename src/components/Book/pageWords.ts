/*
  Splits one page of book text into the structure the spread draws:
  paragraphs -> sentences -> words. Word order and count match countWords()
  (whitespace-separated runs), so a word's index inside a page lines up with
  BookLayout's word counts and the Loc offsets in spreadModel.
*/

export interface PageSentence {
  /** page-wide index of this sentence */
  index: number;
  /** words of the sentence, with their page-wide word index */
  words: { text: string; index: number }[];
}

export interface PageTokens {
  paragraphs: PageSentence[][];
  /** every word of the page in order */
  words: string[];
  /** sentenceOf[w] = page-wide sentence index of word w */
  sentenceOf: number[];
}

// Ends a sentence: . ! ? … optionally followed by closing quotes/brackets.
const SENTENCE_END = /[.!?…]["'”’)\]]*$/;
// Dotted tokens that do NOT end a sentence ("Mr.", "Dr.", "i.e.", initials).
const ABBREVIATION =
  /^(?:mr|mrs|ms|dr|st|prof|sr|jr|vs|etc|cf|viz|no|num|vol|ch|fig|e\.g|i\.e|[A-Za-z])\.$/i;

export function endsSentence(token: string): boolean {
  return SENTENCE_END.test(token) && !ABBREVIATION.test(token);
}

const cache = new Map<string, PageTokens>();
const CACHE_MAX = 48;

export function tokenizePage(text: string): PageTokens {
  const hit = cache.get(text);
  if (hit) {
    return hit;
  }
  const paragraphs: PageSentence[][] = [];
  const words: string[] = [];
  const sentenceOf: number[] = [];
  let sentence = 0;
  for (const para of text.split(/\n{2,}/)) {
    const tokens = para.match(/\S+/g);
    if (!tokens) {
      continue;
    }
    const sentences: PageSentence[] = [];
    let cur: PageSentence = { index: sentence, words: [] };
    tokens.forEach((token, i) => {
      const index = words.length;
      words.push(token);
      sentenceOf.push(cur.index);
      cur.words.push({ text: token, index });
      if (endsSentence(token) && i < tokens.length - 1) {
        sentences.push(cur);
        sentence++;
        cur = { index: sentence, words: [] };
      }
    });
    sentences.push(cur);
    sentence++;
    paragraphs.push(sentences);
  }
  const out = { paragraphs, words, sentenceOf };
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(text, out);
  return out;
}
