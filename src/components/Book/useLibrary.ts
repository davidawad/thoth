import { useCallback, useEffect, useState } from 'react';
import * as CONSTANTS from '../constants';
import type { SampleBook } from '../constants';
import { BASE_PATH } from '../../basePath';
import type { Book, BookMeta } from './bookModel';
import { IngestError, type IngestProgress } from './ingestTypes';
import { ingestFile } from './ingest';
import {
  clearAllData,
  getBook,
  loadLibraryIndex,
  putBook,
  removeBook,
} from './storage';

const SAVE_FAIL =
  "Couldn't save this book in your browser (storage is blocked or full - private browsing?). You can read it now, but it won't be here after you reload.";

const messageFor = (e: unknown): string =>
  e instanceof IngestError
    ? e.message
    : "This file couldn't be read. Try a different PDF or EPUB.";

/** Book + library state: ingest, open, close, remove, clear (never auto-opens). */
export function useLibrary(onClearedAll: () => void) {
  const [book, setBook] = useState<Book | null>(null);
  const [library, setLibrary] = useState<BookMeta[]>([]);
  const [busy, setBusy] = useState<IngestProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => setLibrary(loadLibraryIndex()), []);

  // The landing page never opens a saved book by itself: on load we only read
  // the library index, and the Continue card (pickContinueBook) offers the book.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const ingest = useCallback(
    async (file: File): Promise<void> => {
      setError(null);
      setNotice(null);
      setBusy({ phase: 'reading', label: 'Reading file' });
      try {
        const b = await ingestFile(file, setBusy);
        setBusy({ phase: 'saving', label: 'Saving to this browser' });
        await putBook(b).catch(() => setNotice(SAVE_FAIL));
        setBook(b);
        refresh();
      } catch (e) {
        setError(messageFor(e));
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const ingestSample = useCallback(
    async (s: SampleBook): Promise<void> => {
      setError(null);
      setBusy({ phase: 'reading', label: `Fetching ${s.title}` });
      try {
        const res = await fetch(`${BASE_PATH}/sample-books/${s.filename}`);
        if (!res.ok) {
          throw new Error(String(res.status));
        }
        const blob = await res.blob();
        await ingest(
          new File([blob], s.filename, { type: CONSTANTS.EPUB_MIME_TYPE }),
        );
      } catch {
        setBusy(null);
        setError(`Couldn't load "${s.title}" - try again in a moment.`);
      }
    },
    [ingest],
  );

  const open = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      const b = await getBook(id);
      if (b) {
        setBook(b);
        return;
      }
      await removeBook(id);
      refresh();
      setError('That book is no longer stored in this browser.');
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await removeBook(id);
      setBook((cur) => (cur?.id === id ? null : cur));
      refresh();
    },
    [refresh],
  );

  // Keeps the current-book id on purpose: it is what the Continue card offers.
  const close = useCallback((): void => {
    setBook(null);
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    await clearAllData();
    setBook(null);
    setConfirmClear(false);
    setNotice('All saved books and settings were removed from this browser.');
    refresh();
    onClearedAll();
  }, [refresh, onClearedAll]);

  return {
    book,
    library,
    busy,
    error,
    notice,
    confirmClear,
    setConfirmClear,
    ingest,
    ingestSample,
    open,
    remove,
    close,
    clearAll,
  };
}
