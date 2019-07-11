import React, { Component } from 'react';
import Dropzone from 'react-dropzone';

import PropTypes from 'prop-types';

// TODO remove this
import Swipeable from 'react-swipeable';

import EpubParser from '../EpubParser/EpubParser';
import PDFParser from '../PDFParser/PDFParser';

// import { ReactReader } from "react-reader";

import defaultStyles from './style';

// import Epub from "epubjs/lib/index";

import './FileParser.css';

const PDFTYPE = 'application/pdf';
const EPUBTYPE = 'application/epub+zip';

const allowedFiletypes = [PDFTYPE, EPUBTYPE];

// global.ePub = Epub; // Fix for v3 branch of epub.js -> needs ePub to by a global var

// TODO ADD PROCESSING INFO FOR SLOW / LARGER BOOKS
class FileParser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fileLoaded: false,
      currentFile: undefined,
      updateCallback: this.props.updateCallback
    };

    this.onDrop = files => {
      this.setState({
        fileLoaded: false,
        currentFile: undefined
      });

      const file = files[0];

      console.log('FILEPARSER FILE:', file);

      const fUrl = URL.createObjectURL(file);

      console.log('FILEPARSER FILE URL:', fUrl);

      // TODO update callback with text from page

      this.setState({
        fileLoaded: true,
        currentFile: file,
        currentFileUrl: fUrl
      });
    };

    this.state = {
      files: []
    };
  }

  componentWillReceiveProps({ someProp }) {
    this.setState({ ...this.state, someProp });
  }

  render() {
    // TODO trim these out?
    const {
      url,
      title,
      showToc,
      loadingView,
      epubOptions,
      styles,
      getRendition,
      locationChanged,
      location,
      swipeable
    } = this.props;

    const files = this.state.files.map(file => (
      <li key={file.name}>
        {file.name} - {file.size} bytes
      </li>
    ));

    return (
      <div className="FileParser">
        {/* 
            TODO remove this
        TERRIBLE Workaround. Garbagio. Due to https://github.com/facebook/create-react-app/issues/1574  
        <script src="http://mozilla.github.io/pdf.js/build/pdf.worker.js" type="text/javascript"></script>
        */}

        <Dropzone onDrop={this.onDrop} accept={allowedFiletypes}>
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>

              <aside>
                <h4>Files</h4>
                <ul>{files}</ul>
              </aside>
            </section>
          )}
        </Dropzone>

        {this.state.fileLoaded && this.state.currentFile.type === EPUBTYPE ? (
          // render epub view!

          /*
            <p> 
                Reading Book with React Reader
            </p>

            <ReactReader
                className="ReactReader"
                url={this.state.currentFileUrl}
                title={"Shite"}
                location={"epubcfi(/6/2[cover]!/6)"}
                locationChanged={epubcifi => console.log(epubcifi)}
            />
            */

          <EpubParser
            className="false"
            file={this.state.currentFile}
            // epub parser
            ref={this.readerRef}
            url={this.state.currentFileUrl}
            location={location}
            loadingView={loadingView}
            tocChanged={this.onTocChange}
            locationChanged={locationChanged}
            epubOptions={{}}
            getRendition={getRendition}
          />
        ) : (
          // else
          <span></span>
        )}

        {this.state.fileLoaded && this.state.currentFile.type === PDFTYPE ? (
          // render PDF text!

          <PDFParser
            className="false"
            file={this.state.currentFile}
            ref={this.readerRef}
            url={this.state.currentFileUrl}
            updateCallback={this.props.updateCallback}
          />
        ) : (
          // else
          <span></span>
        )}

        <div id="reader-fodder" />
      </div>
    );
  }
}

FileParser.defaultProps = {
  loadingView: <div>Loading . . . </div>,
  locationChanged: null,
  tocChanged: () => {
    console.log('TOC CHANGED FUNC CALLED?');
  },
  showToc: true,
  styles: defaultStyles
};

FileParser.propTypes = {
  title: PropTypes.string,
  loadingView: PropTypes.element,
  url: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(ArrayBuffer)
  ]),
  showToc: PropTypes.bool,
  location: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  locationChanged: PropTypes.func,
  tocChanged: PropTypes.func,
  styles: PropTypes.object,
  epubOptions: PropTypes.object,
  getRendition: PropTypes.func,
  swipeable: PropTypes.bool
};

export default FileParser;
