import { describe, expect, it } from 'vitest';
import { DEFAULT_READING_SPEED } from '../constants';
import { DEFAULT_WPM } from './defaults';
import { parseWpm } from './storage';

describe('default reading speed', () => {
  it('is 500 wpm', () => {
    expect(DEFAULT_WPM).toBe(500);
  });

  it('is the same everywhere it is used', () => {
    expect(DEFAULT_READING_SPEED).toBe(DEFAULT_WPM);
    expect(parseWpm(null)).toBe(DEFAULT_WPM);
  });

  it('a saved speed still wins over the default', () => {
    expect(parseWpm('300')).toBe(300);
  });

  it('a malformed saved speed falls back to the default', () => {
    expect(parseWpm('fast')).toBe(DEFAULT_WPM);
  });
});
