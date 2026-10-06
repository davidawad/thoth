import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllData } from './storage';

// Node's experimental webstorage shadows jsdom's; use a small in-memory one.
function installStorage(initial: Record<string, string>): Map<string, string> {
  const data = new Map(Object.entries(initial));
  const storage = {
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };

  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
  });

  return data;
}

describe('clearAllData', () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installStorage({
      'thoth.currentBook': 'a',
      'thoth.positions': '{}',
      'thoth.libraryIndex': '[]',
      'thoth.wpm': '300',
      'thoth.textSize': '2',
      'thoth.spotlightDim': 'soft',
      'thoth-palette': 'slate',
      'thoth-custom-accent': '#3a7bd5',
      'thoth-difficulty-highlight-enabled': 'false',
      'thoth-theme': 'dark',
      'someone-elses-key': 'keep me',
    });
  });

  it('removes every key this app wrote, dot- and dash-prefixed alike', async () => {
    await clearAllData();

    expect([...data.keys()]).toEqual(['someone-elses-key']);
  });

  it('leaves other apps on the same origin untouched', async () => {
    await clearAllData();

    expect(data.get('someone-elses-key')).toBe('keep me');
  });

  it('is a no-op when nothing was saved', async () => {
    data.clear();

    await expect(clearAllData()).resolves.toBeUndefined();
    expect(data.size).toBe(0);
  });
});
