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

// global.ePub = Epub; // Fix for v3 branch of epub.js -> needs ePub to by a global var
// window.epub = Epub;

const epubOptions = {};

class EpubParser extends Component {
  constructor(props) {
    super(props);

    this.openBook = this.openBook.bind(this);

    // book file passed into this component.
    const currFile = this.props.file;

    this.state = {
      currentFile: currFile,
      bookLoaded: false,
      book: {}
    };
  }

  componentDidMount() {
    console.log('COMPONENT MOUNT.');

    var reader = new FileReader();

    reader.onload = this.openBook;

    let inputFile = this.props.file;

    reader.readAsArrayBuffer(inputFile);
  }

  openBook(e) {
    let book = {};

    var bookData = e.target.result;

    console.log('BOOKDATA: ', bookData);

    book = Epub(bookData, {
      store: 'epubjs-test',
      restore: true,
      storage: true
    });

    // book.open(bookData);

    console.log('EPUB PARSER BOOK: ', book);

    /*
    this.setState({
      book: book
    })
    */

    // hack
    // book.storage = 'offline';

    // const zip = new JSZip();

    // const {files} = book.zip.zip;

    /*
      Object.keys(files).forEach(file => {
      // file is the file name
      // files[file] is the file object
      // use `zip.utf8decode(files[file]._data.getContent())` to get the text content
      });
    */

    var rendition = book.renderTo('reader-fodder', {
      width: '100%',
      height: 600
    });

    var displayed = rendition.display();

    displayed.then(function(renderer) {
      // Add all resources to the store
      // Add `true` to force re-saving resources
      book.storage.add(book.resources, true).then(() => {
        console.log('stored');
      });
    });

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

      return <p>Book Loading . . .</p>;
    }

    console.log('book on render', this.state.book);

    return (
      <div className="EpubParser">
        <p>{this.state.book.locations}</p>
      </div>
    );
  }
}

/* 
    
      // The ReactReader will expand to 100% of width/height, so be sure to set a height on the parent element, either with position it absolute of window, set height or use paddingTop for proporsjonal scaling 
      <div style={{ position: "relative", height: "100%" }}>
        <EpubView
          url={this.state.currentFile.path}
          location={"epubcfi(/6/2[cover]!/6)"}
          locationChanged={epubcifi => console.log(epubcifi)}
          tocChanged={toc => console.log(toc)}
        />
      </div>
*/

/*
EpubParser.defaultProps = {
    loadingView: null,
    locationChanged: null,
    tocChanged: null,
    // styles: ,
    epubOptions: {}
};
  
EpubParser.propTypes = {
    url: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(ArrayBuffer)
    ]),
    loadingView: PropTypes.element,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    locationChanged: PropTypes.func,
    tocChanged: PropTypes.func,
    styles: PropTypes.object,
    epubOptions: PropTypes.object,
    getRendition: PropTypes.func
};

*/

export default EpubParser;
