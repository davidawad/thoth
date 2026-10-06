import type { Book } from './bookModel';
import { IngestError, type ProgressFn } from './ingestTypes';
import { ingestEpub } from './epubIngest';
import { MAX_UPLOAD_SIZE_BYTES } from '../constants';

export type FileKind = 'pdf' | 'epub' | null;

/** Detects by magic bytes first (a renamed file still works), then by name/MIME. */
export function sniffKind(
  head: Uint8Array,
  name: string,
  mime: string,
): FileKind {
  const ascii = (i: number): string => String.fromCharCode(head[i] ?? 0);
  if (
    ascii(0) === '%' &&
    ascii(1) === 'P' &&
    ascii(2) === 'D' &&
    ascii(3) === 'F'
  ) {
    return 'pdf';
  }
  if (ascii(0) === 'P' && ascii(1) === 'K') {
    return /\.epub$/i.test(name) || mime === 'application/epub+zip'
      ? 'epub'
      : null;
  }
  return null;
}

/** Content-derived id: re-opening the same file reuses its saved book. */
export async function bookIdFor(data: ArrayBuffer): Promise<string> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest).slice(0, 12))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // insecure context / old browser: size + sampled bytes (FNV-1a)
    const bytes = new Uint8Array(data);
    let h = 2166136261;
    const step = Math.max(1, Math.floor(bytes.length / 4096));
    for (let i = 0; i < bytes.length; i += step) {
      h = Math.imul(h ^ (bytes[i] ?? 0), 16777619) >>> 0;
    }
    return `f${bytes.length.toString(16)}${h.toString(16)}`;
  }
}

export async function ingestFile(
  file: File,
  onProgress: ProgressFn,
): Promise<Book> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new IngestError(
      'too-large',
      `This file is larger than ${Math.round(MAX_UPLOAD_SIZE_BYTES / 1048576)} MB.`,
    );
  }
  onProgress({ phase: 'reading', label: 'Reading file' });
  const data = await file.arrayBuffer();
  const kind = sniffKind(
    new Uint8Array(data, 0, Math.min(8, data.byteLength)),
    file.name,
    file.type,
  );
  if (!kind) {
    throw new IngestError(
      'unsupported',
      'Only PDF and EPUB files are supported.',
    );
  }
  const id = await bookIdFor(data);
  if (kind === 'epub') {
    return ingestEpub(data, file.name, id, onProgress);
  }
  const { ingestPdf } = await import('./pdfIngest');
  return ingestPdf(data, file.name, id, onProgress);
}
