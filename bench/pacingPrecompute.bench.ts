import { bench, describe } from "vitest";
import { DEFAULT_PACING_CONFIG } from "../src/components/schemas";
import { PacingPrecomputeCache } from "../src/components/pacing/precompute";

const bookText = Array.from(
  { length: 100_000 },
  (_, index) =>
    ["The", "quiet", "reader", "turned", "another", "page."][index % 6],
).join(" ");

describe("pacing precompute (100k words)", () => {
  bench("chunked fallback", async () => {
    const cache = new PacingPrecomputeCache();
    await cache.get(bookText, DEFAULT_PACING_CONFIG, { useWorker: false });
  });
});
