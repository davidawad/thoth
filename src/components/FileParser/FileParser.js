import React, { Component }  from 'react';
import {useDropzone} from 'react-dropzone';
import styled from 'styled-components';


import EpubParser from '../EpubParser/EpubParser';
// import PDFParser from '../PDFParser/PDFParser';

import './FileParser.css';

const PDFTYPE = 'application/pdf';
const EPUBTYPE = 'application/epub+zip';

// const allowedFiletypes = [PDFTYPE, EPUBTYPE];
const allowedFiletypes = [PDFTYPE];

let ctx = {};


const getColor = (props) => {
  if (props.isDragAccept) {
      return '#00e676';
  }
  if (props.isDragReject) {
      return '#ff1744';
  }
  if (props.isDragActive) {
      return '#2196f3';
  }
  return '#eeeeee';
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${props => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
`;

function StyledDropzone(props) {

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone(props);

  return (
    <div className="container">
      <Container {...getRootProps({isDragActive, isDragAccept, isDragReject})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </Container>
    </div>
  );
}



class FileParser extends Component {
  constructor(props) {
    super(props);

    ctx = this;

    // let pageNumber = typeof(this.props.pageNumber) !== typeof(undefined) && typeof(this.props.pageNumber) !== typeof(null) ? this.props.pageNumber : 0;
    let pageNumber = 0;

    this.setPage = this.setPage.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.turnToPage = this.turnToPage.bind(this);

    this.state = {
      fileLoaded: false,
      currentFile: undefined,
      updateCallback: this.props.updateCallback,
      verbose: this.props.verbose,
      pageNumber: pageNumber,
      pages: [],
    };


    /* TODO move this out of hte file Parser Constructor */
    this.onDrop = files => {
      this.setState({
        fileLoaded: false,
        currentFile: undefined
      });

      const file = files[0];

      const fUrl = URL.createObjectURL(file);

      this.setState({
        fileLoaded: true,
        currentFile: file,
        currentFileUrl: fUrl,
      });
    };

  }

  componentWillReceiveProps({ someProp }) {
    this.setState({ ...this.state, someProp });
  }

  /*
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */
  updateSettings(newSettings) {
    this.setState(newSettings, () => {
      this.turnToPage(this.state.pageNumber);
    })
  }


  // allows a user to dynamically set a page number
  setPage(e) {
    let num = parseInt(e.target.value) ? parseInt(e.target.value) : '';

    this.turnToPage(num);
  }

  turnToPage(num){
    if (num === '' || isNaN(num) || num >= ctx.state.pages.length || num < 0){ return; };

    const content = ctx.state.pages[num];

    this.setState({pageNumber: num}, () => {
      // use callback and write new content.
      ctx.props.updateCallback({
        content: content,
      })
    })
  }


  render() {

    return (
      <div className="FileParser-canvas">

        <StyledDropzone
          className="UploadBox"
          onDrop={this.onDrop}
          accept={allowedFiletypes}
        />

        {/*
        <aside>
        {
          (this.state.currentFile !== undefined) ?  <div><h4>File</h4><ul>{this.state.currentFile.name}</ul></div> : <span></span>
        }
        </aside>
        */}

        {this.state.fileLoaded && this.state.currentFile.type === EPUBTYPE ? (

          // render epub view!

            <EpubParser
              className=""
              file={this.state.currentFile}
              ref={this.readerRef}
              url={this.state.currentFileUrl}
              tocChanged={this.onTocChange}
              epubOptions={{}}
              verbose={this.props.verbose} // TODO set back to normal.
            />

        ) : (
          // else
          <span></span>
        )}

        { this.state.fileLoaded && this.state.currentFile.type === PDFTYPE ? (
          // render PDF text!
          <div>

            <PDFParser
              className="false"
              file={this.state.currentFile}
              ref={this.readerRef}
              url={this.state.currentFileUrl}
              // pageNumber={this.state.pageNumber}
              updateCallback={this.updateSettings}
              verbose={this.props.verbose}
            />


          </div>
        ) : (
          // else
          <span></span>
        )}

        {this.state.fileLoaded ? (

          <div style={{'display': 'inline-block'}}>

            <div
              className="arrow prev"
              onClick={()=>{ this.turnToPage(ctx.state.pageNumber - 1)}}
            >
              ‹
            </div>

            <p>
            Page : {this.state.pageNumber} / {  this.state.pages.length  }
            </p>

            <div
              className="arrow next"
              onClick={()=>{ this.turnToPage(ctx.state.pageNumber + 1)}}
            >
              ›
            </div>

          </div>

          )  : (
          // else
          <span></span>
        )}

        <div id="reader-fodder" />
      </div>
    );
  }
}

export default FileParser;
