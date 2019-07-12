import React, { Component } from 'react';
// import { EpubView } from "react-reader";

// eslint-disable-next-line
import PropTypes from 'prop-types';
// eslint-disable-next-line
import Epub, { Rendition } from 'epubjs/lib/index';

// TODO remove this one too
// import JSZip from "jszip";

// TODO remove this package
// import parser from '@gxl/epub-parser'

global.ePub = Epub; // Fix for v3 branch of epub.js -> needs ePub to by a global var
window.epub = Epub;
const ePub = Epub;

const epubOptions = {
  store: 'epubjs-test',
  restore: true,
  storage: true
};

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
      console.log('COMPONENT MOUNT.');
    }

    var reader = new FileReader();

    reader.onload = this.openBook;

    let inputFile = this.props.file;

    reader.readAsArrayBuffer(inputFile);
  }

  makeRangeCfi = (a, b) => {
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
        if (i == len - 1) {
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
      'epubcfi(' +
      CFI.segmentString(cfi.base) +
      '!' +
      CFI.segmentString(cfi.path) +
      ',' +
      CFI.segmentString(cfi.start) +
      ',' +
      CFI.segmentString(cfi.end) +
      ')'
    );
  };

  openBook(e) {
    let book = {};

    var bookData = e.target.result;

    if (ctx.state.verbose) {
      console.log('BOOKDATA: ', bookData);
    }

    // user uploaded book
    book = Epub(bookData, epubOptions);

    // sample book, this works and fetches text
    // book = ePub("https://s3.amazonaws.com/epubjs/books/moby-dick/OPS/package.opf");

    // var $viewer = document.getElementById("viewer");

    /* 
    book.on("renderer:selected", function(range) {
      console.log("RENDERER SELECTED!")
      var epubcfi = new ePub.EpubCFI();
      var cfi = epubcfi.generateCfiFromRangeAnchor(range, book.renderer.currentChapter.cfiBase);
      console.log("selected:", cfi );
    });
    */

    /* 
    book.ready.then(function(){

      let pg = book.pageList.pages[45];
      console.log("BOOK PAGES :", book.pageList);

      console.log("BOOK PAGE 3 :", pg, pg.cfi);

      book.getRange("epubcfi(/1/1[xchapter_001]!/4/2,/2/2/2[c001s0000]/1:0,/8/2[c001p0003]/1:663)").then(function(range) {

        let text = range.toString()
        console.log(" BOOK TEXT : ", text);
        // $viewer.textContent = text;
      });
    });
    */
    // return;

    // book.open(bookData);

    console.log('EPUB PARSER BOOK: ', book);

    /*
    this.setState({
      book: book
    })
    */

    // hack
    //book.storage = 'offline';

    // const zip = new JSZip();

    // const {files} = book.zip.zip;

    /*
      Object.keys(files).forEach(file => {
      // file is the file name
      // files[file] is the file object
      // use `zip.utf8decode(files[file]._data.getContent())` to get the text content
      });
    */

    /*
    var rendition = book.renderTo('reader-fodder', {
      width: '100%',
      height: 600
    });

    var displayed = rendition.display();
    */

    /*
    displayed.then(function(renderer) {
      // Add all resources to the store
      // Add `true` to force re-saving resources
      book.storage.add(book.resources, true).then(() => {
        console.log('stored');
      });
    });
    */

    /*
    // print out contents ~
    book.loaded.spine.then(spine => {
      spine.each(section => {


        console.log('SECTION: ', section, typeof section);

        section.load().then(contents => {


          // console.log("SECTION DOC:", contents, typeof(contents), contents.contents, contents.document, contents.innerText)
          console.log(
            'SECTION DOC:',
            contents,
            typeof contents,
            contents.contents,
            contents.document
          );



        });
      });
    });
    */

    var $viewer = document.getElementById('viewer');
    var $next = document.getElementById('next');
    var $prev = document.getElementById('prev');

    var currentSection;
    var currentSectionIndex = 6;

    book.loaded.navigation.then(function(toc) {
      var $select = document.getElementById('toc'),
        docfrag = document.createDocumentFragment();

      toc.forEach(function(chapter) {
        // lets the user select a chapter to read.
        var option = document.createElement('option');

        option.textContent = chapter.label;
        option.ref = chapter.href;

        docfrag.appendChild(option);
      });

      $select.appendChild(docfrag);

      $select.onchange = function() {
        var index = $select.selectedIndex,
          url = $select.options[index].ref;

        // TODO get the cfi string for that chapter and get it rendered with the callback~

        display(url);

        return false;
      };

      book.opened.then(function() {
        display(currentSectionIndex);
      });

      /* 
    $next.addEventListener("click", function(){
      var displayed = display(currentSectionIndex+1);
      if(displayed) currentSectionIndex++;
    }, false);

    $prev.addEventListener("click", function(){
      var displayed = display(currentSectionIndex-1);
      if(displayed) currentSectionIndex--;
    }, false);
    */

      function display(item) {
        var section = book.spine.get(item);
        if (section) {
          currentSection = section;

          console.log(section);

          section.render().then(function(html) {
            // $viewer.srcdoc = html;
            $viewer.innerHTML = html;
          });
        }
        return section;
      }
    });

    /* 
    this.setState({
        bookLoaded: true,
    })
    */
  }

  render() {
    // console.log("EPUB DISPLAY GIVEN THE FOLLOWING FILE : ", this.state.currentFile);

    // use empty options to avoid ArrayBuffer urls being treated as options in epub.js

    if (!this.state.bookLoaded) {
      // render spinning icon?
      // return <p>Book Loading . . .</p>;
    }

    console.log('book on render', this.state.book);

    return (
      <div className="EpubParser">
        {/* <p>{this.state.book.locations}</p> */}

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
