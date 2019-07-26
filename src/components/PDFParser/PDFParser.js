import React, { Component } from 'react';

// NOTE: using tool to import web worker directly due to CRA restrictions.
// eslint-disable-next-line
import PDFJSWorker from 'worker-loader!pdfjs-dist/build/pdf.worker.js'; // eslint-disable-line import/no-webpack-loader-syntax

import PDFJS from 'pdfjs-dist';

PDFJS.GlobalWorkerOptions.workerPort = new PDFJSWorker();

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
      verbose: this.props.verbose,
      pageNumber: pageNumber, 
      pages : [], // array of page text content
    };
  }

  componentDidMount() {
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
            ctx.setState({ fileName: data.info.Title });
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
            ctx.props.updateCallback({
              pages: ctx.state.pages
            })
          });
        },
        function(err) {
          console.error('Error: ' + err);
        }
      );
  }

  render() {
    // use empty options to avoid ArrayBuffer urls being treated as options in epub.js
    return <p>{ this.state.bookLoaded ?  '' : 'loading . . . ' }</p>;
  }
}

export default PDFParser;
