import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getBook = vi.fn();

vi.mock('./storage', () => ({
  clearAllData: vi.fn(),
  getBook: (...a: unknown[]) => getBook(...a),
  loadCurrentBookId: () => 'saved-book',
  loadLibraryIndex: () => [
    {
      id: 'saved-book',
      title: 'Saved',
      author: '',
      language: '',
      format: 'epub',
      addedAt: 1,
      totalWords: 10,
      chapterCount: 1,
    },
  ],
  putBook: vi.fn(),
  removeBook: vi.fn(),
  saveCurrentBookId: vi.fn(),
}));

import { useLibrary } from './useLibrary';

describe('useLibrary', () => {
  beforeEach(() => getBook.mockReset());

  it('lists the saved library but never opens a saved book on load', async () => {
    const { result } = renderHook(() => useLibrary(() => {}));
    await waitFor(() => expect(result.current.library).toHaveLength(1));
    expect(result.current.book).toBeNull();
    expect(getBook).not.toHaveBeenCalled();
  });
});
