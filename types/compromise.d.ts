// compromise has no published types. Shimmed only to the surface actually
// used across TextParsingTools.ts and SpeedWritingTools.ts - not the whole
// (large, plugin-extensible) compromise API.
declare module "compromise" {
  export interface CompromiseTerm {
    text: string;
    tags: string[];
    normal: string;
    pre?: string;
    post?: string;
  }

  export interface CompromiseSentence {
    terms: CompromiseTerm[];
  }

  export interface CompromiseView {
    length: number;
    data(): CompromiseSentence[];
  }

  export interface CompromiseDoc {
    sentences(): CompromiseView;
    nouns(): { length: number };
    verbs(): { length: number };
    adjectives(): { length: number };
    adverbs(): { length: number };
    json(): CompromiseSentence[];
  }

  function nlp(text: string): CompromiseDoc;
  export default nlp;
}
