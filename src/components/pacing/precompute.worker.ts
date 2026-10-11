import { scoreDwellMultiplier } from "./dwellMultiplier";
import "./formulaScorers";
import "./extraScorers";
import type { PacingConfig } from "../schemas";

interface WorkerRequest {
  text: string;
  config: PacingConfig;
}

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: Float32Array, transfer: Transferable[]): void;
};

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const words = event.data.text.match(/\S+/g) ?? [];
  const multipliers = new Float32Array(words.length);
  const scored = new Map<string, number>();
  let previous: number | undefined;
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]!;
    let target = scored.get(word);
    if (target === undefined) {
      target = scoreDwellMultiplier(word, event.data.config);
      scored.set(word, target);
    }
    previous =
      previous === undefined
        ? target
        : Math.min(
            event.data.config.maxMultiplier,
            Math.max(
              event.data.config.minMultiplier,
              previous + event.data.config.smoothing * (target - previous),
            ),
          );
    multipliers[index] = previous;
  }
  workerScope.postMessage(multipliers, [multipliers.buffer]);
};
