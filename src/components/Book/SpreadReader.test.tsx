import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import SpreadReader from './SpreadReader';
import type { Book } from './bookModel';
import { loadPositions } from './storage';

const sentence = (i: number): string =>
  `Sentence number ${i} runs along for a few words.`;
const para = (from: number, n: number): string =>
  Array.from({ length: n }, (_, i) => sentence(from + i)).join(' ');
const book: Book = {
  id: 'b1',
  title: 'Test Book',
  author: 'A. Writer',
  language: 'en',
  format: 'epub',
  addedAt: 0,
  totalWords: 0,
  chapterCount: 2,
  chapters: [
    { title: 'First', text: `${para(0, 40)}\n\n${para(40, 40)}` },
    { title: 'Second', text: para(100, 60) },
  ],
};

function installStorage(): void {
  const m = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
      clear: () => m.clear(),
    },
  });
}

function mount(onClose = vi.fn(), modalOpen = false) {
  const utils = render(
    <SpreadReader
      book={book}
      settings={{ readingSpeed: 600 }}
      onSpeedChange={vi.fn()}
      onClose={onClose}
      onOpenSettings={vi.fn()}
      modalOpen={modalOpen}
    />,
  );
  return { ...utils, onClose };
}

const progress = (): string =>
  screen.getByTestId('book-progress').textContent ?? '';
const key = (k: string, init: KeyboardEventInit = {}): void => {
  fireEvent.keyDown(document.body, { key: k, ...init });
};

beforeEach(() => {
  installStorage();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SpreadReader', () => {
  it('shows a two-page spread with the current word marked', () => {
    mount();
    expect(screen.getByTestId('book-page-left')).toBeTruthy();
    expect(screen.getByTestId('book-page-right')).toBeTruthy();
    expect(progress()).toMatch(/^pages 1-2 of \d+ · 0% · /);
    const cur = screen.getByTestId('book-current-word');
    expect(cur.textContent).toBe('Sentence');
    // The focus letter is real inline text (bold + red via CSS), not an overlay.
    expect(cur.querySelector('.sp-hot')?.textContent).toBe('e');
    expect(cur.querySelector('.sp-hot')?.hasAttribute('data-ch')).toBe(false);
  });

  it('turns pages with the arrow keys and the page buttons', () => {
    mount();
    key('ArrowRight');
    expect(progress()).toMatch(/^pages 3-4 /);
    key('PageUp');
    expect(progress()).toMatch(/^pages 1-2 /);
    fireEvent.click(screen.getAllByRole('button', { name: 'Next page' })[0]!);
    expect(progress()).toMatch(/^pages 3-4 /);
    expect(
      screen
        .getAllByRole('button', { name: 'Previous page' })[0]
        ?.hasAttribute('disabled'),
    ).toBe(false);
  });

  it('plays the real text word by word and stops on pause', () => {
    mount();
    key(' ', { code: 'Space' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    const cur = screen.getByTestId('book-current-word').textContent;
    expect(cur).not.toBe('Sentence');
    key(' ', { code: 'Space' });
    const frozen = screen.getByTestId('book-current-word').textContent;
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId('book-current-word').textContent).toBe(frozen);
  });

  it('does not hijack keys while typing in a field or behind a modal', () => {
    mount();
    const speed = screen.getByRole('slider');
    fireEvent.keyDown(speed, { key: 'ArrowRight' });
    expect(progress()).toMatch(/^pages 1-2 /);
  });

  it('is inert behind a modal', () => {
    mount(vi.fn(), true);
    key('ArrowRight');
    expect(progress()).toMatch(/^pages 1-2 /);
  });

  it('saves the word offset and Back to landing flushes it', () => {
    const { onClose } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Next word' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next word' }));
    fireEvent.click(screen.getByText(/Back to landing/));
    expect(onClose).toHaveBeenCalled();
    expect(loadPositions()['b1']).toMatchObject({ chapter: 0, word: 2 });
  });

  it('resumes at the saved word', () => {
    window.localStorage.setItem(
      'thoth.positions',
      JSON.stringify({ b1: { chapter: 1, page: 0, word: 20 } }),
    );
    mount();
    // word 20 of chapter 2 is the number in its third sentence
    expect(screen.getByTestId('book-current-word').textContent).toBe('102');
    expect(document.querySelector('.sp-ttl')?.textContent).toContain('Second');
  });

  it('opens the real chapter list and jumps to a chapter', () => {
    mount();
    fireEvent.click(screen.getAllByRole('button', { name: /Contents/ })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Table of contents' });
    expect(dialog.textContent).toContain('First');
    fireEvent.click(screen.getByText('Second'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('.sp-ttl')?.textContent).toContain('Second');
  });

  it('wires theme and dim controls', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'sepia' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('sepia');
    key('t');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'soft' }));
    expect(document.querySelector('.sp-spread')?.getAttribute('data-dim')).toBe(
      'soft',
    );
  });
});
