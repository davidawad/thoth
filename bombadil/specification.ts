import { extract, always } from '@antithesishq/bombadil';

// Defaults: no uncaught exceptions, no unhandled rejections, no console
// errors, no HTTP 4xx/5xx, plus click/input/scroll/navigation generators.
export * from '@antithesishq/bombadil/browser/defaults';

const page = extract((state) => ({
  hasMain: state.document.querySelector('main') !== null,
  bodyText: (state.document.body?.innerText ?? '').trim().length,
  url: state.window.location.href,
}));

// The app must keep rendering its <main> reader region (no blank page).
export const readerAlwaysRendered = always(() => page.current.hasMain);

export const pageNeverBlank = always(() => page.current.bodyText > 0);

// Navigation never leaves the single-page app.
export const staysOnOrigin = always(
  () => new URL(page.current.url).hostname === 'localhost',
);
