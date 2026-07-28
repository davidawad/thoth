// None of these small academic readability-scoring packages have
// published types (verified against the npm registry before writing
// this). Each is a tiny single-purpose function/wordlist; shimmed only
// as accurately as their actual JS source (checked directly) to avoid
// promising more than these packages document.
//
// The formula functions all read from the same counts shape TextParsingTools
// builds in computeCounts() (character/word/sentence counts, etc.) - mirrored
// here (a structural subset TextCounts satisfies) since this shim has no way
// to import an app-local type cleanly, and a Record<string, number> index
// signature isn't structurally assignable from a closed interface.
interface ReadabilityCounts {
  character: number;
  letter: number;
  syllable: number;
  word: number;
  polysillabicWord: number;
  complexPolysillabicWord: number;
  sentence: number;
  unfamiliarWord: number;
  difficultWord: number;
}

declare module "dale-chall" {
  export const daleChall: string[];
}

declare module "dale-chall-formula" {
  export function daleChallFormula(counts: ReadabilityCounts): number;
  export function daleChallGradeLevel(score: number): [number, number];
}

declare module "coleman-liau" {
  export function colemanLiau(counts: ReadabilityCounts): number;
}

declare module "flesch" {
  export function flesch(counts: ReadabilityCounts): number;
}

declare module "smog-formula" {
  export function smogFormula(counts: ReadabilityCounts): number;
}

declare module "gunning-fog" {
  export function gunningFog(counts: ReadabilityCounts): number;
}

declare module "spache" {
  export const spache: string[];
}

declare module "spache-formula" {
  export function spacheFormula(counts: ReadabilityCounts): number;
}

declare module "automated-readability" {
  export function automatedReadability(counts: ReadabilityCounts): number;
}
