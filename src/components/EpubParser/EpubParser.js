import React, { Component } from "react";

import Epub from "epubjs/lib/index";

let ctx = {};

/*
  Pull plain text out of a parsed epub.js section.

  In the normal case `section.load()` (see openBook below) resolves with
  `xml.documentElement` - a real DOM Element that epub.js already parsed
  via DOMParser. `.textContent` on that element walks the whole subtree and
  concatenates text nodes, which strips every tag for free - no manual HTML
  stripping needed.

  Some spine item extensions aren't recognized by epub.js's archive/request
  layer (see node_modules/epubjs/lib/archive.js handleResponse) and come
  back as a raw markup string instead of a parsed Element. For that case we
  fall back to parsing the string ourselves and stripping tags by reading
  `.textContent` off the parsed body.
*/
function extractText(contents) {
  if (!contents) {
    return "";
  }

  if (typeof contents.textContent === "string") {
    return contents.textContent;
  }

  if (typeof contents === "string") {
    const parsed = new DOMParser().parseFromString(contents, "text/html");
    return (parsed.body && parsed.body.textContent) || "";
  }

  return "";
}

class EpubParser extends Component {
  constructor(props) {
    super(props);

    this.openBook = this.openBook.bind(this);

    // book file passed into this component.
    const currFile = this.props.file;

    ctx = this;

    this.state = {
      currentFile: currFile,
      bookLoaded: false,
      book: {},
      complete: false,
      fileName: "EPUB LOADING . . .",
      verbose: this.props.verbose,
      pages: [], // array of chapter/section text content
      error: null,
    };
  }

  componentDidMount() {
    // Guard against being mounted without an actual uploaded file - the
    // FileParser dropzone hands us a Blob, but this keeps us defensive
    // instead of silently failing inside FileReader.
    if (!(this.props.file instanceof Blob)) {
      this.setState({ error: "No EPUB file was provided to load." });
      return;
    }

    const reader = new FileReader();

    reader.onload = this.openBook;
    reader.onerror = function () {
      ctx.setState({ error: "Could not read the uploaded EPUB file." });
    };

    reader.readAsArrayBuffer(this.props.file);
  }

  openBook(e) {
    const bookData = e.target.result;

    let book;
    try {
      book = Epub(bookData);
    } catch (err) {
      console.error("Error opening EPUB: " + err);
      this.setState({ error: "This file could not be opened as an EPUB." });
      return;
    }

    this.setState({
      bookLoaded: false,
      book: book,
    });

    // epub.js's Book constructor swallows failures internally
    // (it calls `this.open(...).catch(err => emit(OPEN_FAILED))` and never
    // rejects `book.ready`), so a malformed epub would otherwise hang
    // forever instead of surfacing an error - listen for the event instead.
    book.on("openFailed", function (err) {
      console.error("EPUB open failed: " + err);
      ctx.setState({ error: "This file could not be opened as an EPUB." });
    });

    book.ready
      .then(function () {
        if (ctx.state.verbose) {
          console.log("# EPUB Loaded");
        }

        const sections = [];
        book.spine.each(function (section) {
          sections.push(section);
        });

        const pagesText = [];

        // Load + extract each section's text sequentially (mirrors
        // PDFParser's page-by-page promise chain) so we don't hammer the
        // archive/zip reader with concurrent requests.
        let lastPromise = Promise.resolve();

        sections.forEach(function (section) {
          lastPromise = lastPromise
            .then(function () {
              return section.load(book.load.bind(book));
            })
            .then(function (contents) {
              const pageText = extractText(contents).replace(/\s+/g, " ").trim();

              if (ctx.state.verbose) {
                console.log("# Section: " + section.href);
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
        // Drop fully empty sections (covers, nav pages, etc.) so the RSVP
        // reader isn't handed blank pages to flip through.
        const nonEmptyPages = pagesText.filter(function (page) {
          return page.length > 0;
        });

        if (ctx.state.verbose) {
          console.log("# End of Document");
          console.log("ALL PAGE TEXT: ", nonEmptyPages.join(" "));
        }

        ctx.setState(
          {
            bookLoaded: true,
            pages: nonEmptyPages,
          },
          function () {
            ctx.props.updateCallback({
              pages: ctx.state.pages,
            });
          }
        );
      })
      .catch(function (err) {
        console.error("Error extracting EPUB text: " + err);
        ctx.setState({
          error: "Error reading EPUB contents: " + (err && err.message ? err.message : err),
        });
      });
  }

  render() {
    if (this.state.error) {
      return <p className="EpubParser-error">{this.state.error}</p>;
    }

    return <p>{this.state.bookLoaded ? "" : "loading . . . "}</p>;
  }
}

export default EpubParser;
