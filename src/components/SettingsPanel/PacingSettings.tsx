import { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_PACING_CONFIG,
  pacingConfigSchema,
  storedBooleanSchema,
  type PacingConfig,
} from '../schemas';
import { scoreDwellMultiplier } from '../pacing/dwellMultiplier';
import { scorerRegistry } from '../pacing/scorers';

export const PACING_CONFIG_STORAGE_KEY = 'thoth.pacingConfig';
const PACING_ENABLED_STORAGE_KEY = 'thoth.pacingEnabled';
const SAMPLE_SENTENCE =
  'The curious reader paused to consider the unfamiliar word.';

function loadConfig(): PacingConfig {
  try {
    if (typeof window === 'undefined') return DEFAULT_PACING_CONFIG;
    const stored = window.localStorage.getItem(PACING_CONFIG_STORAGE_KEY);
    if (!stored) return DEFAULT_PACING_CONFIG;
    const parsed = pacingConfigSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : DEFAULT_PACING_CONFIG;
  } catch {
    return DEFAULT_PACING_CONFIG;
  }
}

function loadEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    const parsed = storedBooleanSchema.safeParse(
      window.localStorage.getItem(PACING_ENABLED_STORAGE_KEY),
    );
    return parsed.success ? parsed.data : true;
  } catch {
    return true;
  }
}

export default function PacingSettings() {
  const [config, setConfig] = useState<PacingConfig>(loadConfig);
  const [enabled, setEnabled] = useState(loadEnabled);
  const scorers = useMemo(() => scorerRegistry.list(), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PACING_CONFIG_STORAGE_KEY,
        JSON.stringify(config),
      );
    } catch {
      // Storage can be unavailable; settings still work for this session.
    }
  }, [config]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PACING_ENABLED_STORAGE_KEY, String(enabled));
    } catch {
      // Storage can be unavailable; settings still work for this session.
    }
  }, [enabled]);

  const update = (changes: Partial<PacingConfig>) =>
    setConfig((current) => ({ ...current, ...changes }));
  const preview = scoreDwellMultiplier(
    SAMPLE_SENTENCE,
    enabled
      ? config
      : {
          ...config,
          weights: Object.fromEntries(
            Object.keys(config.weights).map((id) => [id, 0]),
          ),
        },
  );

  return (
    <section className="mb-6" aria-labelledby="pacing-settings-heading">
      <h3 id="pacing-settings-heading" className="text-lg font-semibold mb-2">
        Dynamic pacing
      </h3>
      <label className="label cursor-pointer justify-start gap-2 px-0">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          data-testid="pacing-enabled-toggle"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span className="label-text">Enable dynamic pacing</span>
      </label>
      <div className="space-y-3 mt-3">
        {scorers.map((scorer) => (
          <label key={scorer.id} className="form-control">
            <span className="label-text">
              {scorer.id} weight: {config.weights[scorer.id] ?? 0}
            </span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              aria-label={`${scorer.id} weight`}
              data-testid={`pacing-weight-${scorer.id}`}
              value={config.weights[scorer.id] ?? 0}
              onChange={(event) =>
                update({
                  weights: {
                    ...config.weights,
                    [scorer.id]: Number(event.target.value),
                  },
                })
              }
            />
          </label>
        ))}
        <ConfigSlider
          label="Minimum multiplier"
          value={config.minMultiplier}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(value) =>
            update({ minMultiplier: Math.min(value, config.maxMultiplier) })
          }
        />
        <ConfigSlider
          label="Maximum multiplier"
          value={config.maxMultiplier}
          min={1}
          max={100}
          step={0.5}
          onChange={(value) =>
            update({ maxMultiplier: Math.max(value, config.minMultiplier) })
          }
        />
        <ConfigSlider
          label="Curve"
          value={config.curve}
          min={0.25}
          max={3}
          step={0.05}
          onChange={(curve) => update({ curve })}
        />
        <ConfigSlider
          label="Smoothing"
          value={config.smoothing}
          min={0}
          max={1}
          step={0.01}
          onChange={(smoothing) => update({ smoothing })}
        />
      </div>
      <p className="text-sm mt-3" data-testid="pacing-preview">
        Preview for “{SAMPLE_SENTENCE}”: {preview.toFixed(2)}× baseline
      </p>
    </section>
  );
}

function ConfigSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="form-control">
      <span className="label-text">
        {label}: {value}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
