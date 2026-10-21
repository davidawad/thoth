import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PACING_CONFIG } from "../schemas";
import { PacingPrecomputeCache, pacingCacheKey } from "./precompute";
import { pacingMultiplier } from "../Reader/wordTiming";

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
    expect(pacingCacheKey("one two", config, false)).not.toBe(
      pacingCacheKey("one two", config, true),
    );
    expect(pacingCacheKey("one two", config)).not.toBe(
      pacingCacheKey("one two", { ...config, curve: 0.5 }),
    );
    expect(
      pacingCacheKey("one two", config, true, ["one two", "one two"]),
    ).not.toBe(pacingCacheKey("one two", config, true, ["one", "two"]));
  });

  it("misses on first request, hits the same tape, and invalidates on config change", async () => {
    const cache = new PacingPrecomputeCache();
    expect(cache.size).toBe(0);
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
    expect(cache.size).toBe(1);
    cache.invalidate();
    expect(cache.size).toBe(0);
  });

  it("precomputes the same unsmoothed multipliers playback uses", async () => {
    const text = "The exceptionally difficult sentence, ends here.";
    const words = text.match(/\S+/g)!;
    const cache = new PacingPrecomputeCache();
    const values = await cache.get(text, DEFAULT_PACING_CONFIG, {
      useWorker: false,
    });
    expect(Array.from(values)).toEqual(
      words.map((word) =>
        Math.fround(pacingMultiplier(word, DEFAULT_PACING_CONFIG, true, text)),
      ),
    );
  });

  it("sends and receives the typed worker message contract", async () => {
    class MockWorker {
      static instance: MockWorker;
      onmessage: ((event: MessageEvent<Float32Array>) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      request: unknown;
      terminate = vi.fn();

      constructor() {
        MockWorker.instance = this;
      }

      postMessage(request: unknown): void {
        this.request = request;
        this.onmessage?.({
          data: new Float32Array([1.25, 1.5]),
        } as MessageEvent<Float32Array>);
      }
    }
    vi.stubGlobal("Worker", MockWorker);

    const config = DEFAULT_PACING_CONFIG;
    const sentences = ["The first sentence.", "The second sentence."];
    const values = await new PacingPrecomputeCache().get(
      "first second",
      config,
      { enabled: false, sentences },
    );

    expect(MockWorker.instance.request).toEqual({
      text: "first second",
      config,
      enabled: false,
      sentences,
    });
    expect(Array.from(values)).toEqual([1.25, 1.5]);
    expect(MockWorker.instance.terminate).toHaveBeenCalledOnce();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
