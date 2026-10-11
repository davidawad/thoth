import { afterEach, describe, expect, it } from "vitest";
import TextParsingTools from "../TextParsingTools";
import { wordDisplayTime } from "./wordTiming";

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
