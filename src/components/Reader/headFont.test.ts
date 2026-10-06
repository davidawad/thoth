import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_HEAD_FONT,
  HEAD_FONTS,
  HEAD_FONT_ATTRIBUTE,
  HEAD_FONT_STORAGE_KEY,
  applyHeadFont,
  applyStoredHeadFont,
  parseHeadFont,
  readHeadFont,
  saveHeadFont,
} from './headFont';

// Node's experimental webstorage shadows jsdom's; use a tiny in-memory one.
function installStorage(): Map<string, string> {
  const data = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    },
    configurable: true,
  });

  return data;
}

let data: Map<string, string>;

beforeEach(() => {
  data = installStorage();
  document.documentElement.removeAttribute(HEAD_FONT_ATTRIBUTE);
});

afterEach(() => {
  document.documentElement.removeAttribute(HEAD_FONT_ATTRIBUTE);
});

describe('head font options', () => {
  it('defaults to Atkinson Hyperlegible, and lists it first', () => {
    expect(DEFAULT_HEAD_FONT).toBe('atkinson-hyperlegible');
    expect(HEAD_FONTS[0]?.id).toBe('atkinson-hyperlegible');
  });

  it('has unique ids', () => {
    const ids = HEAD_FONTS.map((font) => font.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('parseHeadFont', () => {
  it('keeps every known id', () => {
    for (const font of HEAD_FONTS) {
      expect(parseHeadFont(font.id)).toBe(font.id);
    }
  });

  it('falls back to the default for unknown, empty or missing values', () => {
    expect(parseHeadFont('comic-sans')).toBe(DEFAULT_HEAD_FONT);
    expect(parseHeadFont('')).toBe(DEFAULT_HEAD_FONT);
    expect(parseHeadFont(null)).toBe(DEFAULT_HEAD_FONT);
    expect(parseHeadFont(undefined)).toBe(DEFAULT_HEAD_FONT);
  });
});

describe('save / read / apply', () => {
  it('reads the default when nothing is saved', () => {
    expect(readHeadFont()).toBe(DEFAULT_HEAD_FONT);
  });

  it('round-trips a saved choice', () => {
    saveHeadFont('georgia');

    expect(data.get(HEAD_FONT_STORAGE_KEY)).toBe('georgia');
    expect(readHeadFont()).toBe('georgia');
  });

  it('never saves an unknown id', () => {
    saveHeadFont('nonsense');

    expect(data.get(HEAD_FONT_STORAGE_KEY)).toBe(DEFAULT_HEAD_FONT);
  });

  it('ignores a malformed saved value', () => {
    data.set(HEAD_FONT_STORAGE_KEY, '<script>');

    expect(readHeadFont()).toBe(DEFAULT_HEAD_FONT);
  });

  it('sets the attribute on the root, validating the id', () => {
    applyHeadFont('inter', document.documentElement);
    expect(document.documentElement.getAttribute(HEAD_FONT_ATTRIBUTE)).toBe(
      'inter',
    );

    applyHeadFont('nonsense', document.documentElement);
    expect(document.documentElement.getAttribute(HEAD_FONT_ATTRIBUTE)).toBe(
      DEFAULT_HEAD_FONT,
    );
  });

  it('applyStoredHeadFont applies what was saved', () => {
    saveHeadFont('verdana');

    expect(applyStoredHeadFont()).toBe('verdana');
    expect(document.documentElement.getAttribute(HEAD_FONT_ATTRIBUTE)).toBe(
      'verdana',
    );
  });
});
