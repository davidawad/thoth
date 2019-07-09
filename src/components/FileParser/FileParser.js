import React, {Component} from 'react';
import Dropzone from 'react-dropzone';


import EpubParser from '../EpubParser/EpubParser';


const PDFTYPE = 'application/pdf'
const EPUBTYPE = 'application/epub+zip'

const allowedFiletypes = [PDFTYPE, EPUBTYPE]


class FileParser extends Component {
  constructor() {
    super();

    
    this.state = {
        fileLoaded : false,
        currentFile : undefined,
    }
    
    this.onDrop = (files) => {
      
      // console.log(files, files[0], typeof(files[0])); 
      
      const file = files[0];

      var reader = new FileReader();

      // reader.readAsBinaryString(file); 

      // reader.read


      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')

      /* 
      reader.onload = () => {
        // Do whatever you want with the file contents
        // const binaryStr = reader.result

      }
      */


      // TODO validate Filetype! 


      // TODO update callback with text from page
      // this.props.updateCallback({})

      
      this.setState({ 
          fileLoaded: true, 
          currentFile: file,
        })
        
    };



    this.state = {
      files: []
    };
  }

  render() {
    const files = this.state.files.map(file => (
      <li key={file.name}>
        {file.name} - {file.size} bytes
      </li>
    ));

    return (


      <div className="">

        <Dropzone 
            onDrop={this.onDrop}
            accept={allowedFiletypes}

            >

            {({getRootProps, getInputProps}) => (
            <section className="container">

                <div {...getRootProps({className: 'dropzone'})}>
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

        { this.state.fileLoaded && (this.state.currentFile.type === EPUBTYPE)? 

            // render epub view!
            <EpubParser
                className="false"
                file={this.state.currentFile}
                />

            // else
            :   <span></span>
        }
         
        
        { /* 
        TODO PDF rendering ~ 

        { this.state.fileLoaded && (this.state.currentFile.type === PDFTYPE)? 

            // render pdf view!
            <SOMETHING
                className="false"
                file={this.state.currentFile}
                />

            // else
            :   <span></span>
            
        }

        */ }



      </div>
    );
  }
}

export default FileParser;