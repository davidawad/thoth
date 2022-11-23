import React, { Component } from "react";
// import { EpubView } from "react-reader";

// eslint-disable-next-line
import PropTypes from "prop-types";
// eslint-disable-next-line
import Epub, { Rendition } from "epubjs/lib/index";

// TODO remove this one too
// import JSZip from "jszip";

// TODO remove this package
// import parser from '@gxl/epub-parser'

global.ePub = Epub; // Fix for v3 branch of epub.js -> needs ePub to by a global var
// window.epub = Epub;
const ePub = Epub;

let epubOptions = {
  store: "epubjs-test",
  restore: true,
  storage: true
};

epubOptions = {};

let ctx = {};

class EpubParser extends Component {
  constructor(props) {
    super(props);

    this.openBook = this.openBook.bind(this);
    this.makeRangeCfi = this.makeRangeCfi.bind(this);

    ctx = this;

    // book file passed into this component.
    const currFile = this.props.file;

    this.state = {
      currentFile: currFile,
      bookLoaded: false,
      book: {},
      verbose: this.props.verbose
    };
  }

  componentDidMount() {
    if (ctx.state.verbose) {
      console.log("COMPONENT MOUNT.");
    }

    var reader = new FileReader();

    reader.onload = this.openBook;

    let inputFile = this.props.file;

    reader.readAsArrayBuffer(inputFile);
  }

  makeRangeCfi(a, b) {
    const CFI = new ePub.CFI();
    const start = CFI.parse(a),
      end = CFI.parse(b);
    const cfi = {
      range: true,
      base: start.base,
      path: {
        steps: [],
        terminal: null
      },
      start: start.path,
      end: end.path
    };
    const len = cfi.start.steps.length;
    for (let i = 0; i < len; i++) {
      if (CFI.equalStep(cfi.start.steps[i], cfi.end.steps[i])) {
        if (i === len - 1) {
          // Last step is equal, check terminals
          if (cfi.start.terminal === cfi.end.terminal) {
            // CFI's are equal
            cfi.path.steps.push(cfi.start.steps[i]);
            // Not a range
            cfi.range = false;
          }
        } else cfi.path.steps.push(cfi.start.steps[i]);
      } else break;
    }
    cfi.start.steps = cfi.start.steps.slice(cfi.path.steps.length);
    cfi.end.steps = cfi.end.steps.slice(cfi.path.steps.length);

    return (
      "epubcfi(" +
      CFI.segmentString(cfi.base) +
      "!" +
      CFI.segmentString(cfi.path) +
      "," +
      CFI.segmentString(cfi.start) +
      "," +
      CFI.segmentString(cfi.end) +
      ")"
    );
  }

  openBook(e) {
    let book = {};

    var bookData = e.target.result;

    if (ctx.state.verbose) {
      console.log("BOOKDATA: ", bookData);
    }

    // user uploaded book
    book = Epub(bookData, epubOptions);

    // sample book, this works and fetches text
    // book = ePub("https://s3.amazonaws.com/epubjs/books/moby-dick/OPS/package.opf", epubOptions);

    console.log("EPUB PARSER BOOK: ", book);

    var $viewer = document.getElementById("viewer");
    var $next = document.getElementById("next");
    var $prev = document.getElementById("prev");

    var currentSection;
    var currentSectionIndex = 6;

    book.loaded.navigation.then(function (toc) {
      var $select = document.getElementById("toc"),
        docfrag = document.createDocumentFragment();

      toc.forEach(function (chapter) {
        // lets the user select a chapter to read.
        var option = document.createElement("option");

        option.textContent = chapter.label;
        option.ref = chapter.href;

        docfrag.appendChild(option);
      });

      $select.appendChild(docfrag);

      $select.onchange = function () {
        var index = $select.selectedIndex,
          url = $select.options[index].ref;

        // shitty hack to save time
        let nextUrl = $select.options[index].ref;
        if (typeof $select.options[index + 1] !== typeof undefined) {
          nextUrl = $select.options[index + 1].ref;
        }

        console.log("next url", nextUrl);

        // TODO get the cfi string for that chapter and get it rendered with the callback~
        console.log("DISPLAYING A THING CALLED URL", url);

        // This rendering doesn't work for some reason.
        let rendition = book.renderTo("fodder");

        console.log("LOCATION: ", rendition);

        // TODO this library is shit.

        /*
        let currChapterCFIStr = book.spine.get(url).cfiBase;

        console.log("CURRENT CHAPTER", currChapterCFIStr);

        let nextChapterCFIStr = book.spine.get(nextUrl).cfiBase;

        console.log("NEXT CHAPTER", nextChapterCFIStr);
        */

        // See this github issue for getting rendering
        // https://github.com/futurepress/epub.js/issues/363

        // only code example here.

        // https://github.com/search?q=makeRangeCfi&type=Code
        // https://github.com/johnfactotum/foliate/blob/22fdcfa739ee308721295f94bd9c553e98dbf20b/src/assets/viewer.js#L251

        // after getting the Rendition back, you should be able to get the string from the rendition range

        const [a, b] = [
          rendition.currentLocation().start.cfi,
          rendition.currentLocation().end.cfi
        ];

        book.getRange(ctx.makeRangeCfi(a, b)).then((range) => {
          console.log("RANGE OF TEXT", range.toString());
        });

        display(url);

        return false;
      };

      book.opened.then(function () {
        display(currentSectionIndex);
      });

      $next.addEventListener(
        "click",
        function () {
          var displayed = display(currentSectionIndex + 1);
          if (displayed) currentSectionIndex++;
        },
        false
      );

      $prev.addEventListener(
        "click",
        function () {
          var displayed = display(currentSectionIndex - 1);
          if (displayed) currentSectionIndex--;
        },
        false
      );

      function display(item) {
        var section = book.spine.get(item);

        if (section) {
          currentSection = section;

          let cfiString = currentSection.cfiBase;
          console.log("cfi String", cfiString);

          console.log("SECTION HERE: ", section);

          section.render().then(function (html) {
            $viewer.innerHTML = html;

            // console.log("HTML TO DISPLAY: ", html);
          });
        }

        return section;
      }
    });
  }

  render() {
    // console.log("EPUB DISPLAY GIVEN THE FOLLOWING FILE : ", this.state.currentFile);

    // use empty options to avoid ArrayBuffer urls being treated as options in epub.js

    if (!this.state.bookLoaded) {
      // render spinning icon?
      // return <p>Book Loading . . .</p>;
    }

    console.log("book on render", this.state.book);

    return (
      <div className="EpubParser">
        {/* <p>{this.state.book.locations}</p> */}

        <div id="fodder" className="scrolled"></div>

        <select id="toc"></select>
        <div id="viewer" className="scrolled"></div>

        <div id="prev" className="arrow">
          ‹
        </div>

        <div id="next" className="arrow">
          ›
        </div>
      </div>
    );
  }
}

export default EpubParser;
