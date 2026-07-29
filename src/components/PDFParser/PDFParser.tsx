import { Component } from 'react';

// Namespace import, not default - pdfjs-dist's UMD build doesn't reliably
// expose a default export under Next.js's bundler (it did resolve to
// `undefined` at runtime with `import PDFJS from 'pdfjs-dist'`).
import * as PDFJS from 'pdfjs-dist';

interface PDFParserProps {
  file: File;
  url: string | undefined;
  verbose: boolean | undefined;
  updateCallback: (settings: { pages: string[] }) => void;
}

interface PDFParserState {
  bookLoaded: boolean;
  fileName: string;
  error: string | null;
  verbose: boolean | undefined;
  pages: string[];
}

let ctx: PDFParser;

class PDFParser extends Component<PDFParserProps, PDFParserState> {
  constructor(props: PDFParserProps) {
    super(props);

    this.openBook = this.openBook.bind(this);

    ctx = this;

    this.state = {
      bookLoaded: false,
      fileName: 'PDF LOADING . . .',
      error: null,
      verbose: this.props.verbose,
      pages: [], // array of page text content
    };
  }

  componentDidMount(): void {
    // readAsArrayBuffer throws a TypeError on anything that isn't a Blob/File.
    // Guard the boundary rather than crash on a missing/malformed file prop.
    if (!(this.props.file instanceof Blob)) {
      console.error('PDFParser: expected a File/Blob, got', this.props.file);
      return;
    }

    // Set once per page load, not at module scope, so this never runs during
    // Next.js SSR / static page-data collection (no Worker/window there).
    // The CRA `worker-loader!` inline-loader syntax doesn't resolve under
    // Next.js, so `postinstall` copies pdf.worker.min.mjs into public/ instead
    // and we point pdfjs at it directly by URL. pdfjs-dist v6 ships the
    // worker as an ES module (.mjs) instead of the old UMD .js build.
    PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const reader = new FileReader();

    reader.onload = this.openBook;

    reader.readAsArrayBuffer(this.props.file);
  }

  openBook(e: ProgressEvent<FileReader>): void {
    // Loading file from file system into typed array
    const bookData = e.target?.result as ArrayBuffer;
    // pdfjs-dist v6 dropped the raw ArrayBuffer overload of getDocument() -
    // it now only accepts a DocumentInitParameters object.
    const loadingTask = PDFJS.getDocument({ data: bookData });

    // reset bookLoaded as we now want to load a new book
    this.setState({
      bookLoaded: false,
    });

    // buffer of text from all pages
    const pagesText: string[] = [];

    loadingTask.promise
      .then(function (doc) {
        const numPages = doc.numPages;

        if (ctx.state.verbose) {
          console.log('# Document Loaded');
          console.log('Number of Pages: ' + numPages);
          console.log();
        }

        let lastPromise: Promise<unknown>; // will be used to chain promises

        lastPromise = doc.getMetadata().then(function (data) {
          if (ctx.state.verbose) {
            console.log('# Metadata Is Loaded');
            console.log('## Info');
            console.log(JSON.stringify(data.info, null, 2));
            // data.info is absent for PDFs without a metadata dictionary; don't
            // assume the Title key (or the object) exists.
            const info = data.info as { Title?: string } | undefined;
            if (info && info.Title) {
              ctx.setState({ fileName: info.Title });
            }
            console.log();
          }

          if (data.metadata) {
            if (ctx.state.verbose) {
              console.log('## Metadata');
              // pdfjs-dist v6 dropped Metadata#getAll() in favor of making
              // Metadata directly iterable ([key, value] entries).
              console.log(
                JSON.stringify(Object.fromEntries(data.metadata), null, 2),
              );
              console.log();
            }
          }
        });

        const loadPage = function (pageNum: number) {
          return doc.getPage(pageNum).then(function (page) {
            if (ctx.state.verbose) {
              console.log('# Page ' + pageNum);
              console.log();
            }

            return page
              .getTextContent()
              .then(function (content) {
                // Content contains lots of information about the text layout and
                // styles, but we need only strings at the moment
                const strings = content.items.map(function (item) {
                  return 'str' in item ? item.str : '';
                });

                const pageText = strings.join(' ');

                if (ctx.state.verbose) {
                  console.log('## Text Content');
                  console.log(pageText);
                }

                pagesText.push(pageText);
              })
              .then(function () {
                console.log();
              });
          });
        };

        // Loading of the first page will wait on metadata and subsequent loadings
        // will wait on the previous pages.
        for (let i = 1; i <= numPages; i++) {
          lastPromise = lastPromise.then(loadPage.bind(null, i));
        }

        return lastPromise;
      })

      .then(
        function () {
          if (ctx.state.verbose) {
            console.log('# End of Document');
            console.log('ALL PAGE TEXT : ', pagesText.join(' '));
          }

          // we now have all page text, let's now add it to component state
          ctx.setState(
            {
              bookLoaded: true,
              pages: pagesText,
            },
            () => {
              if (typeof ctx.props.updateCallback === 'function') {
                ctx.props.updateCallback({
                  pages: ctx.state.pages,
                });
              }
            },
          );
        },
        function (err: unknown) {
          console.error('Error: ' + err);
          ctx.setState({
            error:
              'Could not read this PDF (' + err + '). Try a different file.',
          });
        },
      );
  }

  render() {
    if (this.state.error) {
      return <p className="PDFParser-error">{this.state.error}</p>;
    }
    return <p>{this.state.bookLoaded ? '' : 'loading . . . '}</p>;
  }
}

export default PDFParser;
