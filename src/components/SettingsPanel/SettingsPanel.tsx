import React, { useCallback, useEffect, useState } from 'react';

import TextParsingTools from '../TextParsingTools';
import {
  THEMES,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  FONT_ATTRIBUTION,
  LEGIBILITY_REFERENCES,
  DEFAULT_READABILITY_METRIC,
  SPEED_WRITING_STORAGE_KEY,
} from '../constants';
import type { AppSettings, UpdateCallback } from '../types';

// Reads the theme currently applied to <html data-theme="..."> - set before
// first paint by the inline script in pages/_document.js - so this selector
// starts in sync with what's already on screen rather than flashing to a
// default value once the component mounts.
function getActiveTheme(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}

// Applies + persists a theme. Swapping `data-theme` is daisyui's own
// mechanism (see tailwind.config.js `daisyui.themes`) - no parallel
// CSS-variable system needed.
function applyTheme(themeId: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-theme', themeId);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // localStorage can throw (private browsing, storage disabled, quota,
    // etc). The theme still applies for this session, it just won't
    // persist across visits.
  }
}

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

const SettingsPanel = (props: SettingsPanelProps) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [readabilityMetric, setReadabilityMetric] = useState(
    props.readabilityMetric || DEFAULT_READABILITY_METRIC
  );
  const [speedWritingEnabled, setSpeedWritingEnabled] = useState(
    Boolean(props.speedWritingEnabled)
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
    []
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
    [props]
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
            String(enabled)
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
    [props]
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

      <TypefaceSection />
      <LegibilityResearchSection />
    </div>
  );
};

export default SettingsPanel;
