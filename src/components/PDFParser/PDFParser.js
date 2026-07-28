import React, { Component } from 'react';

// Namespace import, not default - pdfjs-dist's UMD build doesn't reliably
// expose a default export under Next.js's bundler (it did resolve to
// `undefined` at runtime with `import PDFJS from 'pdfjs-dist'`).
import * as PDFJS from 'pdfjs-dist';

let ctx = {};

class PDFParser extends Component {
  constructor(props) {
    super(props);

    this.openBook = this.openBook.bind(this);

    // book file passed into this component.
    const currFile = this.props.file;

    ctx = this;

    // if we get a pageNumber then let's do that.
    let pageNumber = 0;
    if (typeof(this.props.pageNumber) !== typeof(undefined)) {
      pageNumber = this.props.pageNumber;
    }

    this.state = {
      currentFile: currFile,
      bookLoaded: false,
      book: {},
      content: '',
      complete: false,
      fileName: 'PDF LOADING . . .',
      error: null,
      verbose: this.props.verbose,
      pageNumber: pageNumber, 
      pages : [], // array of page text content
    };
  }

  componentDidMount() {
    // readAsArrayBuffer throws a TypeError on anything that isn't a Blob/File.
    // Guard the boundary rather than crash on a missing/malformed file prop.
    if (!(this.props.file instanceof Blob)) {
      console.error('PDFParser: expected a File/Blob, got', this.props.file);
      return;
    }

    // Set once per page load, not at module scope, so this never runs during
    // Next.js SSR / static page-data collection (no Worker/window there).
    // The CRA `worker-loader!` inline-loader syntax doesn't resolve under
    // Next.js, so `postinstall` copies pdf.worker.min.js into public/ instead
    // and we point pdfjs at it directly by URL.
    PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    const reader = new FileReader();

    reader.onload = this.openBook;

    reader.readAsArrayBuffer(this.props.file);
  }

  openBook(e) {
    // Loading file from file system into typed array

    var bookData = e.target.result;
    var loadingTask = PDFJS.getDocument(bookData);

    // reset bookLoaded as we now want to load a new book
    this.setState({
      bookLoaded: false
    })

    // buffer of text from all pages
    let pagesText = [];

    loadingTask.promise
      .then(function(doc) {
        var numPages = doc.numPages;

        if (ctx.state.verbose) {
          console.log('# Document Loaded');
          console.log('Number of Pages: ' + numPages);
          console.log();
        }

        var lastPromise; // will be used to chain promises

        lastPromise = doc.getMetadata().then(function(data) {
          if (ctx.state.verbose) {
            console.log('# Metadata Is Loaded');
            console.log('## Info');
            console.log(JSON.stringify(data.info, null, 2));
            // data.info is absent for PDFs without a metadata dictionary; don't
            // assume the Title key (or the object) exists.
            if (data.info && data.info.Title) {
              ctx.setState({ fileName: data.info.Title });
            }
            console.log();
          }

          if (data.metadata) {
            if (ctx.state.verbose) {
              console.log('## Metadata');
              console.log(JSON.stringify(data.metadata.getAll(), null, 2));
              console.log();
            }
          }
        });

        var loadPage = function(pageNum) {
          return doc.getPage(pageNum).then(function(page) {
            if (ctx.state.verbose) {
              console.log('# Page ' + pageNum);
              console.log();
            }

            return page
              .getTextContent()
              .then(function(content) {
                // Content contains lots of information about the text layout and
                // styles, but we need only strings at the moment
                var strings = content.items.map(function(item) {
                  return item.str;
                });

                const pageText = strings.join(' ');

                if (ctx.state.verbose) {
                  console.log('## Text Content');
                  console.log(pageText);
                }

                pagesText.push(pageText);
              })
              .then(function() {
                console.log();
              });
          });
        };

        // Loading of the first page will wait on metadata and subsequent loadings
        // will wait on the previous pages.
        for (var i = 1; i <= numPages; i++) {
          lastPromise = lastPromise.then(loadPage.bind(null, i));
        }

        return lastPromise;
      })

      .then(function() {
          if (ctx.state.verbose) {
            console.log('# End of Document');
            console.log('ALL PAGE TEXT : ', pagesText.join(' ')); 
          }

          // we now have all page text, let's now add it to component state
          ctx.setState({
            bookLoaded: true,
            pages: pagesText, 
            pageNumber: 0,

          }, () => {
            if (typeof ctx.props.updateCallback === 'function') {
              ctx.props.updateCallback({
                pages: ctx.state.pages
              })
            }
          });
        },
        function(err) {
          console.error('Error: ' + err);
          ctx.setState({ error: 'Could not read this PDF (' + err + '). Try a different file.' });
        }
      );
  }

  render() {
    if (this.state.error) {
      return <p className="PDFParser-error">{this.state.error}</p>;
    }
    return <p>{ this.state.bookLoaded ?  '' : 'loading . . . ' }</p>;
  }
}

export default PDFParser;
