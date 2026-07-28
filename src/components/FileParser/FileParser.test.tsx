import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import FileParser from './FileParser';

// EpubParser/PDFParser pull in epub.js/pdfjs-dist, which do real work (web
// workers, binary parsing) that isn't relevant here - FileParser only
// renders them once a file is loaded, which never happens in this test.
// Mocking keeps this test scoped to the dropzone-prop-leak regression it's
// guarding against.
vi.mock('../EpubParser/EpubParser', () => ({
  default: () => null,
}));
vi.mock('../PDFParser/PDFParser', () => ({
  default: () => null,
}));

describe('FileParser / StyledDropzone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not trigger the "does not recognize the ... prop" React DOM warning', () => {
    // A hasAttribute() check on the rendered DOM can't tell a fixed
    // component from a broken one here: React drops an unrecognized
    // camelCase prop from the actual DOM output either way and only logs a
    // dev warning about it (verified directly - rendering a plain <div
    // isDragActive={true} /> produces `<div></div>`, no literal attribute,
    // alongside the console.error warning). The only real signal is that
    // warning itself, so assert against console.error's actual call args
    // (React logs it as a printf-style template + separate substitution
    // args, not a pre-interpolated string).
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<FileParser updateCallback={() => {}} verbose={false} />);

    const offendingProps = ['isDragActive', 'isDragAccept', 'isDragReject'];
    const domPropWarnings = consoleErrorSpy.mock.calls.filter(
      ([template]) =>
        typeof template === 'string' &&
        template.includes('does not recognize the `%s` prop on a DOM element'),
    );

    for (const propName of offendingProps) {
      const match = domPropWarnings.find((args) => args.includes(propName));
      expect(match).toBeUndefined();
    }
  });
});
