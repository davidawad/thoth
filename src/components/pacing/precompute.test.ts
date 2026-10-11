import { describe, expect, it } from "vitest";
import { DEFAULT_PACING_CONFIG } from "../schemas";
import { PacingPrecomputeCache, pacingCacheKey } from "./precompute";

describe("pacing precompute cache", () => {
  it("keys text and canonicalized config independently of key insertion order", () => {
    const config = {
      ...DEFAULT_PACING_CONFIG,
      weights: { wordDifficulty: 0.5, other: 1 },
    };
    const reordered = { ...config, weights: { other: 1, wordDifficulty: 0.5 } };
    expect(pacingCacheKey("one two", config)).toBe(
      pacingCacheKey("one two", reordered),
    );
    expect(pacingCacheKey("one two", config)).not.toBe(
      pacingCacheKey("one three", config),
    );
    expect(pacingCacheKey("one two", config)).not.toBe(
      pacingCacheKey("one two", { ...config, curve: 0.5 }),
    );
  });

  it("reuses entries and invalidates prior config values when config changes", async () => {
    const cache = new PacingPrecomputeCache();
    const first = await cache.get("A book sentence.", DEFAULT_PACING_CONFIG, {
      useWorker: false,
    });
    expect(cache.size).toBe(1);
    expect(
      await cache.get("A book sentence.", DEFAULT_PACING_CONFIG, {
        useWorker: false,
      }),
    ).toBe(first);

    const changed = {
      ...DEFAULT_PACING_CONFIG,
      minMultiplier: 3,
      maxMultiplier: 3,
    };
    const second = await cache.get("A book sentence.", changed, {
      useWorker: false,
    });
    expect(second).not.toBe(first);
    expect(Array.from(second)).not.toEqual(Array.from(first));
    expect(cache.size).toBe(1);
    cache.invalidate();
    expect(cache.size).toBe(0);
  });
});
