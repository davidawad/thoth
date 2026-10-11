import TextParsingTools from '../TextParsingTools';
import { scoreDwellMultiplier } from '../pacing/dwellMultiplier';
import '../pacing';
import {
  pacingConfigSchema,
  DEFAULT_PACING_CONFIG,
  storedBooleanSchema,
} from '../schemas';

export function loadPacingSettings() {
  try {
    const raw = window.localStorage.getItem('thoth.pacingConfig');
    const parsed = raw ? pacingConfigSchema.safeParse(JSON.parse(raw)) : null;
    const enabledRaw = storedBooleanSchema.safeParse(
      window.localStorage.getItem('thoth.pacingEnabled'),
    );
    return {
      config: parsed?.success ? parsed.data : DEFAULT_PACING_CONFIG,
      enabled: enabledRaw.success ? enabledRaw.data : true,
    };
  } catch {
    return { config: DEFAULT_PACING_CONFIG, enabled: true };
  }
}

/**
 * How long one word stays on screen, in ms, at `wpm` words per minute. The
 * base slot (60000 / wpm) is stretched for long words, commas and sentence
 * ends, then scaled by how difficult the word is (syllables + dictionary
 * familiarity). Shared by the landing Reader and the book spread so both pace
 * text identically.
 */
export function wordDisplayTime(
  word: string,
  wpm: number,
  sentence = word,
): number {
  let t = 60000 / wpm;

  // over six characters: a quarter longer
  if (word.length > 6) {
    t += t / 4;
  }

  // a comma: half as long again
  if (~word.indexOf(',')) {
    t += t / 2;
  }

  // sentence-ending punctuation: two and a half times
  if (/[.?!]/.test(word)) {
    t += t * 1.5;
  }

  // Scale continuously by word difficulty. Lower-case-initial words (articles,
  // pronouns, ...) and very short words are excluded.
  const lowerInitial = word.charAt(0) === word.charAt(0).toLowerCase();
  if (!lowerInitial && word.length > 2) {
    const { config, enabled } = loadPacingSettings();
    if (enabled) {
      t *= scoreDwellMultiplier(
        TextParsingTools.stripPunctuation(word).toLowerCase(),
        config,
        undefined,
        sentence,
      );
    }
  }

  return t;
}
