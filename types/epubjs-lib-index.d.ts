// epubjs has no published types, and EpubParser imports the internal
// "epubjs/lib/index" subpath directly (not the package's main entry),
// which no community @types package covers either way. This shim only
// types the surface EpubParser.tsx actually uses - not the whole
// epub.js API - to avoid promising accuracy this shim can't back up.
declare module "epubjs/lib/index" {
  // A spine item. `section.load(request)` resolves the parsed contents:
  // an Element when epub.js's own request/archive layer recognizes the
  // resource type (it runs the response through DOMParser first), or a
  // raw string for resource types it doesn't parse itself.
  export interface Section {
    href: string;
    load(request: (url: string) => Promise<unknown>): Promise<Element | string>;
    unload(): void;
  }

  export interface Spine {
    each(callback: (section: Section) => void): void;
  }

  export interface Book {
    ready: Promise<void>;
    spine: Spine;
    load(url: string): Promise<unknown>;
    on(event: "openFailed", callback: (error: unknown) => void): void;
  }

  export default function Epub(bookData: ArrayBuffer): Book;
}
