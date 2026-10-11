import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PacingSettings, { PACING_CONFIG_STORAGE_KEY } from './PacingSettings';

describe('PacingSettings', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it('renders scorer and tuning controls and persists updates', () => {
    render(<PacingSettings />);

    expect(screen.getByTestId('pacing-weight-wordDifficulty')).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Curve' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Smoothing' })).toBeTruthy();
    const preview = screen.getByTestId('pacing-preview').textContent;

    fireEvent.change(screen.getByTestId('pacing-weight-wordDifficulty'), {
      target: { value: '2' },
    });
    expect(
      JSON.parse(window.localStorage.getItem(PACING_CONFIG_STORAGE_KEY)!),
    ).toMatchObject({
      weights: { wordDifficulty: 2 },
    });
    fireEvent.change(screen.getByRole('slider', { name: 'Curve' }), {
      target: { value: '2' },
    });
    expect(screen.getByTestId('pacing-preview').textContent).not.toBe(preview);

    fireEvent.click(screen.getByTestId('pacing-enabled-toggle'));
    expect(window.localStorage.getItem('thoth.pacingEnabled')).toBe('false');
  });

  it('uses defaults when stored config is invalid', () => {
    window.localStorage.setItem(PACING_CONFIG_STORAGE_KEY, '{bad json');
    render(<PacingSettings />);

    expect(screen.getByTestId('pacing-weight-wordDifficulty')).toHaveProperty(
      'value',
      '1',
    );
  });

  it('loads persisted valid config and enabled state', () => {
    window.localStorage.setItem(
      PACING_CONFIG_STORAGE_KEY,
      JSON.stringify({
        weights: { wordDifficulty: 1.5 },
        minMultiplier: 0.1,
        maxMultiplier: 4,
        curve: 2,
        smoothing: 0.5,
      }),
    );
    window.localStorage.setItem('thoth.pacingEnabled', 'false');
    render(<PacingSettings />);

    expect(screen.getByTestId('pacing-weight-wordDifficulty')).toHaveProperty(
      'value',
      '1.5',
    );
    expect(screen.getByTestId('pacing-enabled-toggle')).toHaveProperty(
      'checked',
      false,
    );
  });
});
