import { afterEach, describe, expect, it } from "vitest";
import TextParsingTools from "../TextParsingTools";
import { pacingMultiplier, wordDisplayTime } from "./wordTiming";
import { clauseDepthScorer } from "../pacing/extraScorers";
import { DEFAULT_PACING_CONFIG } from "../schemas";

afterEach(() => window.localStorage.clear());

describe("wordDisplayTime", () => {
  it("keeps baseline word difficulty scaling when dynamic pacing is disabled", () => {
    window.localStorage.setItem("thoth.pacingEnabled", "false");
    const word = "Antidisestablishmentarianism";
    const baseDuration = (60000 / 600) * 1.25;
    expect(wordDisplayTime(word, 600)).toBe(
      baseDuration *
        TextParsingTools.wordDifficultyMultiplier(word.toLowerCase()),
    );
  });
});

describe("wordDisplayTime with configured scorers", () => {
  it("applies the configured sentence multiplier to lowercase words", () => {
    window.localStorage.setItem(
      "thoth.pacingConfig",
      JSON.stringify({
        weights: { clauseDepth: 1 },
        minMultiplier: 0.5,
        maxMultiplier: 2,
        curve: 1,
        smoothing: 1,
      }),
    );
    const sentence = "the cat, which sat, and the dog, which ran, slept.";
    const multiplier = clauseDepthScorer.scoreSentence!(sentence);
    expect(multiplier).toBeGreaterThan(1);
    expect(wordDisplayTime("cat", 600, sentence)).toBe(
      (60000 / 600) * multiplier,
    );
  });

  it("matches the legacy word-difficulty timing with the default config", () => {
    for (const word of ["the", "of", "Is", "Antidisestablishmentarianism", "Cat,"]) {
      const lowerInitial = word.charAt(0) === word.charAt(0).toLowerCase();
      const legacy =
        !lowerInitial && word.length > 2
          ? TextParsingTools.wordDifficultyMultiplier(
              TextParsingTools.stripPunctuation(word).toLowerCase(),
            )
          : 1;
      expect(pacingMultiplier(word, DEFAULT_PACING_CONFIG, true)).toBe(legacy);
    }
  });
});
