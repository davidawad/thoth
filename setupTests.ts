import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// Vitest's jsdom environment can inherit Node's experimental localStorage
// getter, which throws when no --localstorage-file is configured. Keep tests
// independent of that runtime flag with a small, shared Storage implementation.
class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(String(key)) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(String(key));
  }

  setItem(key: string, value: string): void {
    this.values.set(String(key), String(value));
  }
}

const testStorage = new MemoryStorage();
beforeEach(() => testStorage.clear());
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testStorage,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: testStorage,
  });
}
