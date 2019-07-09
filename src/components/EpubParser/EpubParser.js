import React, { Component } from "react";
// import { EpubView } from "react-reader";


import PropTypes from "prop-types";
import Epub from "epubjs/lib/index";
global.ePub = Epub; // Fix for v3 branch of epub.js -> needs ePub to by a global var



class EpubParser extends Component {

  constructor(props) {

    super(props);

    // this.props.file
    
    const currFile = this.props.file;

    
    
    this.state = {
        currentFile: currFile, 
    }

  }

  render() {

    console.log("EPUB DISPLAY GIVEN THE FOLLOWING FILE : ", this.state.currentFile);

    

    // use empty options to avoid ArrayBuffer urls being treated as options in epub.js
    const epubOptions = {};

    this.book = new Epub(this.state.currentFile.path, epubOptions);

    console.log("BOOK:", this.book);
    
    // await this.book.opened; 

    console.log("BOOK PROPS:", this.book.pagelist, this.book.opened);

    this.book.loaded.navigation.then(({ toc }) => {
        console.log("TOC:", toc);  
    });
    

    // ePub("/path/to/book.epub", {})

    return (
    {/* 
    
      // The ReactReader will expand to 100% of width/height, so be sure to set a height on the parent element, either with position it absolute of window, set height or use paddingTop for proporsjonal scaling 
      <div style={{ position: "relative", height: "100%" }}>
        <EpubView
          url={this.state.currentFile.path}
          location={"epubcfi(/6/2[cover]!/6)"}
          locationChanged={epubcifi => console.log(epubcifi)}
          tocChanged={toc => console.log(toc)}
        />
      </div>
    */}
    
    );
  }
}



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



export default EpubParser;