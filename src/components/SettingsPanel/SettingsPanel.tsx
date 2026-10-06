import React, { useCallback, useEffect, useState } from 'react';

import TextParsingTools from '../TextParsingTools';
import PaletteField from '../palette/PaletteField';
import HeadFontField from '../Reader/HeadFontField';
import { applyStoredPalette } from '../palette/applyPalette';
import { applyTheme, getActiveTheme } from '../Book/theme';
import {
  THEMES,
  DEFAULT_THEME,
  FONT_ATTRIBUTION,
  FOUNDATIONAL_RESEARCH,
  FOUNDATIONAL_RESEARCH_PAPER,
  LEGIBILITY_REFERENCES,
  DEFAULT_READABILITY_METRIC,
  SPEED_WRITING_STORAGE_KEY,
  DIFFICULTY_HIGHLIGHT_STORAGE_KEY,
} from '../constants';
import type { AppSettings, UpdateCallback } from '../types';

function TypefaceSection() {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Typeface</h3>
      <p className="text-sm">
        Body text is set in{' '}
        <a
          href={FONT_ATTRIBUTION.url}
          target="_blank"
          rel="noreferrer"
          className="link link-primary"
        >
          {FONT_ATTRIBUTION.name}
        </a>
        , designed by {FONT_ATTRIBUTION.designer}. Distributed free via{' '}
        {FONT_ATTRIBUTION.source} under the {FONT_ATTRIBUTION.license}.
      </p>
    </section>
  );
}

function FoundationalResearchSection() {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-2">
        Research this app is based on
      </h3>
      <p className="text-sm mb-2">
        Thoth started as{' '}
        <a
          href={FOUNDATIONAL_RESEARCH_PAPER.url}
          target="_blank"
          rel="noreferrer"
          className="link link-primary"
        >
          a paper
        </a>{' '}
        on why fixed-speed RSVP readers ignore how reading actually works, and
        what changes when word timing accounts for it. The citations below are
        grouped by what they informed.
      </p>
      <div className="text-xs space-y-3 opacity-80 max-h-64 overflow-y-auto pr-2">
        {FOUNDATIONAL_RESEARCH.map((category) => (
          <div key={category.title}>
            <h4 className="font-semibold not-italic mb-1 opacity-100">
              {category.title}
            </h4>
            <ul className="space-y-2 list-disc list-inside">
              {category.references.map((reference) => (
                <li key={reference.citation}>
                  {reference.url ? (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      {reference.citation}
                    </a>
                  ) : (
                    reference.citation
                  )}
                  {reference.note ? <> &mdash; {reference.note}</> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegibilityResearchSection() {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-2">Legibility research</h3>
      <p className="text-sm mb-2">
        Thoth&apos;s typography (font, size, line height, line length, contrast)
        is informed by the following sources. Where a finding wasn&apos;t
        clearly actionable, the note below says so instead of forcing it.
      </p>
      <ul className="text-xs space-y-2 list-disc list-inside opacity-80 max-h-48 overflow-y-auto pr-2">
        {LEGIBILITY_REFERENCES.map((reference) => (
          <li key={reference.url}>
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              {reference.citation}
            </a>
            {reference.note ? <> &mdash; {reference.note}</> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SettingsPanelProps extends Partial<AppSettings> {
  updateCallback: UpdateCallback;
}

// Difficulty heat map toggle: persists the choice and bubbles it up so the
// Reader rebuilds its editor with (or without) the per-sentence highlighting.
function DifficultyHighlightToggle({
  initial,
  updateCallback,
}: {
  initial: boolean;
  updateCallback: UpdateCallback;
}) {
  const [enabled, setEnabled] = useState(initial);

  const handleToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      setEnabled(next);

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(
            DIFFICULTY_HIGHLIGHT_STORAGE_KEY,
            String(next),
          );
        }
      } catch {
        // localStorage unavailable - the toggle still works this session.
      }

      updateCallback({ difficultyHighlightEnabled: next });
    },
    [updateCallback],
  );

  return (
    <>
      <label className="label cursor-pointer justify-start gap-2 px-0 mt-3">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          name="difficultyHighlightEnabled"
          data-testid="difficulty-highlight-toggle"
          checked={enabled}
          onChange={handleToggle}
        />
        <span className="label-text">Highlight text by difficulty</span>
      </label>
      <p className="text-sm opacity-70 mt-2">
        Tints each sentence of the loaded text from green (easier) to red
        (harder), so you can see where the difficult passages are before you
        start. Difficulty is relative to the rest of the text. Red and green can
        be hard to tell apart for some people; turn this off if so.
      </p>
    </>
  );
}

const SettingsPanel = (props: SettingsPanelProps) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [readabilityMetric, setReadabilityMetric] = useState(
    props.readabilityMetric || DEFAULT_READABILITY_METRIC,
  );
  const [speedWritingEnabled, setSpeedWritingEnabled] = useState(
    Boolean(props.speedWritingEnabled),
  );

  // Sync from the DOM once mounted (client-only - avoids SSR/client
  // mismatches, since the modal this lives in isn't rendered on the server).
  useEffect(() => {
    setTheme(getActiveTheme());
  }, []);

  const handleThemeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextTheme = event.target.value;
      setTheme(nextTheme);
      applyTheme(nextTheme);
      // The palette's dark/light half depends on the theme - re-resolve it.
      applyStoredPalette();

      // NOTE: deliberately NOT calling props.updateCallback() here. That
      // callback feeds into App's top-level state (pages/index.tsx), which
      // is spread as props into <Reader>; Reader's componentDidUpdate
      // treats ANY prop change (not just `content` changes) as a reason to
      // fully re-run text parsing (TextParsingTools/compromise). Theme
      // state is fully self-contained (DOM `data-theme` attribute +
      // localStorage - see applyTheme() above), so there's nothing for
      // App/Reader to react to here; routing it through updateCallback
      // would only add risk for no benefit.
    },
    [],
  );

  // Fires the moment the user picks a new metric - reuses the existing
  // updateCallback pattern so the choice flows straight up to pages/index.tsx
  // state (which also persists it to localStorage).
  const handleReadabilityMetricChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextMetric = event.target.value;
      setReadabilityMetric(nextMetric);
      props.updateCallback({ readabilityMetric: nextMetric });
    },
    [props],
  );

  // Speed Writing (paper §8.4 "Speed Writing"): opt-in, OFF by default.
  // Persists the choice to localStorage and bubbles it up to the App/Reader
  // via updateCallback (same pattern the readability metric picker uses).
  const handleSpeedWritingToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const enabled = event.target.checked;
      setSpeedWritingEnabled(enabled);

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(
            SPEED_WRITING_STORAGE_KEY,
            String(enabled),
          );
        }
      } catch {
        // localStorage unavailable (private browsing, disabled, etc) - the
        // toggle still works for this session, it just won't persist.
      }

      if (typeof props.updateCallback === 'function') {
        props.updateCallback({ speedWritingEnabled: enabled });
      }
    },
    [props],
  );

  return (
    <div className="reading-measure-narrow text-left">
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Display</h3>

        <label
          className="form-control w-full max-w-xs"
          htmlFor="thoth-theme-select"
        >
          <span className="label-text block mb-1">Theme</span>
        </label>
        <select
          id="thoth-theme-select"
          data-testid="theme-select"
          className="select select-bordered select-sm w-full max-w-xs"
          value={theme}
          onChange={handleThemeChange}
        >
          {THEMES.map((themeOption) => (
            <option key={themeOption.id} value={themeOption.id}>
              {themeOption.label}
            </option>
          ))}
        </select>
        <p className="text-sm opacity-70 mt-2">
          Saved to this browser and applied automatically next time you visit.
        </p>
      </section>

      <PaletteField />

      <HeadFontField />

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Readability</h3>

        <label
          className="form-control w-full max-w-xs"
          htmlFor="readabilityMetric"
        >
          <span className="label-text block mb-1">
            Difficulty metric driving reading speed
          </span>
        </label>
        <select
          id="readabilityMetric"
          name="readabilityMetric"
          data-testid="readability-metric-select"
          className="select select-bordered select-sm w-full max-w-xs"
          value={readabilityMetric}
          onChange={handleReadabilityMetricChange}
        >
          {TextParsingTools.READABILITY_METRICS.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>

        <DifficultyHighlightToggle
          initial={props.difficultyHighlightEnabled ?? true}
          updateCallback={props.updateCallback}
        />
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Speed Writing</h3>
        <label className="label cursor-pointer justify-start gap-2 px-0">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            name="speedWritingEnabled"
            checked={speedWritingEnabled}
            onChange={handleSpeedWritingToggle}
          />
          <span className="label-text">
            Simplify difficult words before reading
          </span>
        </label>
        <p className="text-sm opacity-70 mt-2">
          When enabled, Thoth looks up simpler, familiar synonyms for unfamiliar
          words in your text and shows you exactly what it changed before you
          read - your original text is never edited silently. Off by default.
          Requires network access (uses the Datamuse synonym API); if it's
          unavailable, reading falls back to your original text automatically.
        </p>
      </section>

      <FoundationalResearchSection />
      <TypefaceSection />
      <LegibilityResearchSection />
    </div>
  );
};

export default SettingsPanel;
