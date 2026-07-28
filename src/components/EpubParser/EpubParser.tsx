import React, { Component } from 'react';

import Epub, { type Section } from 'epubjs/lib/index';
import extractText from './extractText';
import {
  stripGutenbergBoilerplate,
  isSkippableFrontOrBackMatter,
} from './frontBackMatter';

interface EpubParserProps {
  file: File;
  url?: string | undefined;
  verbose: boolean | undefined;
  updateCallback: (settings: { pages: string[] }) => void;
}

interface EpubParserState {
  bookLoaded: boolean;
  fileName: string;
  verbose: boolean | undefined;
  pages: string[];
  error: string | null;
}

let ctx: EpubParser;

class EpubParser extends Component<EpubParserProps, EpubParserState> {
  constructor(props: EpubParserProps) {
    super(props);

    this.openBook = this.openBook.bind(this);

    ctx = this;

    this.state = {
      bookLoaded: false,
      fileName: 'EPUB LOADING . . .',
      verbose: this.props.verbose,
      pages: [], // array of chapter/section text content
      error: null,
    };
  }

  componentDidMount(): void {
    // Guard against being mounted without an actual uploaded file - the
    // FileParser dropzone hands us a Blob, but this keeps us defensive
    // instead of silently failing inside FileReader.
    if (!(this.props.file instanceof Blob)) {
      this.setState({ error: 'No EPUB file was provided to load.' });
      return;
    }

    const reader = new FileReader();

    reader.onload = this.openBook;
    reader.onerror = function () {
      ctx.setState({ error: 'Could not read the uploaded EPUB file.' });
    };

    reader.readAsArrayBuffer(this.props.file);
  }

  openBook(e: ProgressEvent<FileReader>): void {
    const bookData = e.target?.result as ArrayBuffer;

    let book;
    try {
      book = Epub(bookData);
    } catch (err) {
      console.error('Error opening EPUB: ' + err);
      this.setState({ error: 'This file could not be opened as an EPUB.' });
      return;
    }

    this.setState({
      bookLoaded: false,
    });

    // epub.js's Book constructor swallows failures internally
    // (it calls `this.open(...).catch(err => emit(OPEN_FAILED))` and never
    // rejects `book.ready`), so a malformed epub would otherwise hang
    // forever instead of surfacing an error - listen for the event instead.
    book.on('openFailed', function (err: unknown) {
      console.error('EPUB open failed: ' + err);
      ctx.setState({ error: 'This file could not be opened as an EPUB.' });
    });

    book.ready
      .then(function () {
        if (ctx.state.verbose) {
          console.log('# EPUB Loaded');
        }

        const sections: Section[] = [];
        book.spine.each(function (section) {
          sections.push(section);
        });

        const pagesText: string[] = [];

        // Load + extract each section's text sequentially (mirrors
        // PDFParser's page-by-page promise chain) so we don't hammer the
        // archive/zip reader with concurrent requests.
        let lastPromise: Promise<unknown> = Promise.resolve();

        sections.forEach(function (section) {
          lastPromise = lastPromise
            .then(function () {
              return section.load(book.load.bind(book));
            })
            .then(function (contents) {
              // Gutenberg's spine sections mark everything (including the
              // cover and license header) linear="yes" - there's no
              // spec-level signal to skip them, so strip the Gutenberg
              // START/END boilerplate markers out of the raw text here
              // (they can fall mid-page, not just on page boundaries) and
              // let isSkippableFrontOrBackMatter drop what's left over
              // below.
              const pageText = stripGutenbergBoilerplate(
                extractText(contents).replace(/\s+/g, ' ').trim(),
              );

              if (ctx.state.verbose) {
                console.log('# Section: ' + section.href);
                console.log(pageText);
              }

              pagesText.push(pageText);

              // free the parsed document now that we've pulled the text out.
              section.unload();
            });
        });

        return lastPromise.then(function () {
          return pagesText;
        });
      })
      .then(function (pagesText) {
        // Drop empty sections and Gutenberg front/back-matter leftovers
        // (covers, nav pages, license-header residue, etc.) so the RSVP
        // reader isn't handed junk pages to flip through and lands on real
        // chapter-1 content first.
        const contentPages = (pagesText as string[]).filter(function (page) {
          return page.length > 0 && !isSkippableFrontOrBackMatter(page);
        });

        if (ctx.state.verbose) {
          console.log('# End of Document');
          console.log('ALL PAGE TEXT: ', contentPages.join(' '));
        }

        ctx.setState(
          {
            bookLoaded: true,
            pages: contentPages,
          },
          function () {
            ctx.props.updateCallback({
              pages: ctx.state.pages,
            });
          },
        );
      })
      .catch(function (err) {
        console.error('Error extracting EPUB text: ' + err);
        const message = err instanceof Error ? err.message : String(err);
        ctx.setState({
          error: 'Error reading EPUB contents: ' + message,
        });
      });
  }

  render() {
    if (this.state.error) {
      return <p className="EpubParser-error">{this.state.error}</p>;
    }

    return <p>{this.state.bookLoaded ? '' : 'loading . . . '}</p>;
  }
}

export default EpubParser;
