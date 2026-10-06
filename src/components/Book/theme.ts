import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from '../constants';
import { applyStoredPalette } from '../palette/applyPalette';

export const THEME_IDS = THEMES.map((t) => t.id);

export function getActiveTheme(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}

/** Sets + saves the theme, then re-resolves the palette (it depends on the theme's mode). */
export function applyTheme(themeId: string): void {
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // storage blocked: applies for this session only
  }
  applyStoredPalette();
}

export function nextTheme(current: string): string {
  const i = THEME_IDS.indexOf(current);
  return THEME_IDS[(i + 1) % THEME_IDS.length] ?? DEFAULT_THEME;
}
