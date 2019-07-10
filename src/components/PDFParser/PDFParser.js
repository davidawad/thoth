import React, { Component } from "react";
// import { EpubView } from "react-reader";

// import pdfjsLib from "pdfjs";
import pdfjs, { PDFDataRangeTransport } from "pdfjs-dist";

// Setting worker path to worker bundle.
pdfjs.workerSrc = '../../../node_modules/pdfjs-dist/build/pdf.worker.js';




class PDFParser extends Component {


    constructor(props) {

    super(props);

    this.openBook   = this.openBook.bind(this);


    // book file passed into this component.
    const currFile = this.props.file;

    const ctx = this; 

    this.state = {
        currentFile: currFile, 
        bookLoaded: false,
        book : {},
    }
  }


  componentDidMount() {
    console.log("COMPONENT MOUNT.");

    var reader = new FileReader();

    reader.onload = this.openBook;

    let inputFile = this.props.file;

    reader.readAsArrayBuffer(inputFile);
    
    
  }

  openBook(e) {

    // Loading file from file system into typed array
    
    // let pdfPath = this.props.url;
    
    var bookData = e.target.result;

    console.log("BOOK DATA: ", bookData)

    console.log("WORKER SOURCE : ", pdfjs.workerSrc);

    //const PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'


    // Will be using promises to load document, pages and misc data instead of
    // callback.

    var loadingTask = pdfjs.getDocument(bookData);

    loadingTask.promise.then(function(doc) {

        var numPages = doc.numPages;
        console.log('# Document Loaded');
        console.log('Number of Pages: ' + numPages);
        console.log();

        var lastPromise; // will be used to chain promises

        lastPromise = doc.getMetadata().then(function (data) {

            console.log('# Metadata Is Loaded');
            console.log('## Info');
            console.log(JSON.stringify(data.info, null, 2));
            console.log();

            if (data.metadata) {
                console.log('## Metadata');
                console.log(JSON.stringify(data.metadata.getAll(), null, 2));
                console.log();
            }
        });

        var loadPage = function (pageNum) {
            return doc.getPage(pageNum).then(function (page) {

                console.log('# Page ' + pageNum);

                var viewport = page.getViewport({ scale: 1.0, });

                console.log('Size: ' + viewport.width + 'x' + viewport.height);
                console.log();

                return page.getTextContent().then(function (content) {
                    // Content contains lots of information about the text layout and
                    // styles, but we need only strings at the moment
                    var strings = content.items.map(function (item) {
                    return item.str;
                    });
                    console.log('## Text Content');
                    console.log(strings.join(' '));
                }).then(function () {
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

    }).then(function () {
        console.log('# End of Document');
    }, function (err) {
        console.error('Error: ' + err);
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

        return (
            <p>
                Book Loading . . . 
            </p>

            
        )

    }
    
    console.log("book on render", this.state.book)

    return (

        <div className="PDFParser">

            <p>
            { '' }
            </p>

        </div>

    );
  }


}




export default PDFParser;