import TextParsingTools from '../TextParsingTools';
import { scoreDwellMultiplier } from '../pacing/dwellMultiplier';
import '../pacing';
import { scorerRegistry } from '../pacing/scorers';
import {
  pacingConfigSchema,
  DEFAULT_PACING_CONFIG,
  storedBooleanSchema,
  type PacingConfig,
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

export const PACING_SETTINGS_CHANGED = 'thoth:pacing-settings-changed';

export function notifyPacingSettingsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PACING_SETTINGS_CHANGED));
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

  const { config, enabled } = loadPacingSettings();
  return t * pacingMultiplier(word, config, enabled, sentence);
}

const LEGACY_SCORER = 'wordDifficulty';

/**
 * The dwell multiplier applied to `word` by wordDisplayTime. The legacy word
 * difficulty scorer skips lower-case-initial (articles, pronouns, ...) and very
 * short words, as it always has; configured and sentence scorers apply to every
 * word. Disabled pacing keeps only the legacy word difficulty baseline.
 */
export function pacingMultiplier(
  word: string,
  config: PacingConfig,
  enabled: boolean,
  sentence = word,
): number {
  const lowerInitial = word.charAt(0) === word.charAt(0).toLowerCase();
  const legacyEligible = !lowerInitial && word.length > 2;
  const scored = TextParsingTools.stripPunctuation(word).toLowerCase();

  if (!enabled) {
    // The toggle only disables configurable scorers. Preserve the original
    // word difficulty adjustment regardless of the dynamic pacing setting.
    const baseline = scorerRegistry.get(LEGACY_SCORER);
    return legacyEligible && baseline ? baseline.score(scored) : 1;
  }

  const weights = legacyEligible
    ? config.weights
    : Object.fromEntries(
        Object.entries(config.weights).filter(([id]) => id !== LEGACY_SCORER),
      );
  if (!Object.values(weights).some((weight) => weight > 0)) return 1;
  return scoreDwellMultiplier(scored, { ...config, weights }, undefined, sentence);
}
