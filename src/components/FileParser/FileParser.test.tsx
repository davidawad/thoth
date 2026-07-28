import React from 'react';
import { describe, it, expect, vi } from 'vitest';
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
  it('does not leak react-dropzone drag-state booleans onto the DOM element', () => {
    const { container } = render(
      <FileParser updateCallback={() => {}} verbose={false} />,
    );

    // Container is the styled.div rendered inside the ".container" wrapper -
    // getRootProps() spreads onto it, so this is exactly the element that
    // used to receive isDragActive/isDragAccept/isDragReject as raw DOM
    // attributes before they were converted to transient ($-prefixed) props.
    const dropzoneEl = container.querySelector('.container > div');
    expect(dropzoneEl).not.toBeNull();

    const leakedAttrNames = [
      'isDragActive',
      'isDragAccept',
      'isDragReject',
      'isdragactive',
      'isdragaccept',
      'isdragreject',
      '$isDragActive',
      '$isDragAccept',
      '$isDragReject',
    ];

    for (const attr of leakedAttrNames) {
      expect(dropzoneEl?.hasAttribute(attr)).toBe(false);
    }
  });
});
