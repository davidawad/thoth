import React, { Component } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import styled from 'styled-components';
import * as CONSTANTS from '../constants';
import { uploadedFileSchema } from '../schemas';
import type { UpdateCallback } from '../types';
import type { SampleBook } from '../constants';

import EpubParser from '../EpubParser/EpubParser';
import PDFParser from '../PDFParser/PDFParser';

const PDFTYPE = CONSTANTS.PDF_MIME_TYPE;
const EPUBTYPE = CONSTANTS.EPUB_MIME_TYPE;

// react-dropzone v14's `accept` prop is a MIME-type -> extensions map, not a
// bare array (the array form silently disables the file-type filter).
const allowedFiletypes = { [PDFTYPE]: ['.pdf'], [EPUBTYPE]: ['.epub'] };

interface FileParserProps {
  updateCallback: UpdateCallback;
  verbose: boolean | undefined;
}

interface FileParserState {
  fileLoaded: boolean;
  currentFile: File | undefined;
  currentFileUrl: string | undefined;
  verbose: boolean | undefined;
  pageNumber: number;
  pages: string[];
  uploadError: string | null;
  loadingSampleId: string | null;
}

let ctx: FileParser;

interface DropzoneStyleProps {
  isDragActive?: boolean;
  isDragAccept?: boolean;
  isDragReject?: boolean;
}

const getColor = (props: DropzoneStyleProps): string => {
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
};

const Container = styled.div<DropzoneStyleProps>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${(props) => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border 0.24s ease-in-out;
`;

function StyledDropzone(props: DropzoneOptions) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone(props);

  return (
    <div className="container">
      <Container
        {...getRootProps({ isDragActive, isDragAccept, isDragReject })}
      >
        <input {...getInputProps()} />
        <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
      </Container>
    </div>
  );
}

class FileParser extends Component<FileParserProps, FileParserState> {
  onDrop: (files: File[]) => void;

  constructor(props: FileParserProps) {
    super(props);

    ctx = this;

    this.setPage = this.setPage.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.turnToPage = this.turnToPage.bind(this);
    this.loadFile = this.loadFile.bind(this);
    this.loadSampleBook = this.loadSampleBook.bind(this);

    this.state = {
      fileLoaded: false,
      currentFile: undefined,
      currentFileUrl: undefined,
      verbose: this.props.verbose,
      pageNumber: 0,
      pages: [],
      uploadError: null,
      loadingSampleId: null,
    };

    this.onDrop = (files) => {
      // react-dropzone hands us only the accepted files; a rejected or empty
      // drop yields []. Bail before URL.createObjectURL(undefined) throws.
      if (!Array.isArray(files) || files.length === 0) {
        return;
      }

      const file = files[0];

      if (!(file instanceof Blob)) {
        return;
      }

      this.loadFile(file);
    };
  }

  // Shared by drag-drop uploads and the shipped sample-book picker - both
  // hand this a real File, and from here on the two paths are identical.
  loadFile(file: File): void {
    this.setState({
      fileLoaded: false,
      currentFile: undefined,
      uploadError: null,
    });

    // react-dropzone's `accept` prop already filters by MIME type/
    // extension, but that's a UI-level filter the user can bypass (e.g.
    // dragging in a renamed file) - validate the actual shape of what we
    // were handed before trusting it enough to hand off to pdfjs-dist/
    // epub.js.
    const validation = uploadedFileSchema.safeParse({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.success) {
      this.setState({
        uploadError:
          "This file couldn't be loaded - only PDF and EPUB files up to 100MB are supported.",
      });
      return;
    }

    const fUrl = URL.createObjectURL(file);

    this.setState({
      fileLoaded: true,
      currentFile: file,
      currentFileUrl: fUrl,
    });
  }

  // Fetches one of the epubs shipped under public/sample-books/ and feeds it
  // through the exact same loadFile() path a dropped file takes, so someone
  // can try the reader without hunting down their own book first.
  async loadSampleBook(book: SampleBook): Promise<void> {
    this.setState({ loadingSampleId: book.id, uploadError: null });

    try {
      const response = await fetch(`/sample-books/${book.filename}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch sample book: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], book.filename, {
        type: CONSTANTS.EPUB_MIME_TYPE,
      });

      this.loadFile(file);
    } catch {
      this.setState({
        uploadError: `Couldn't load "${book.title}" - try again in a moment.`,
      });
    } finally {
      this.setState({ loadingSampleId: null });
    }
  }

  /*
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */
  updateSettings(newSettings: { pages: string[] }): void {
    this.setState({ pages: newSettings.pages }, () => {
      this.turnToPage(this.state.pageNumber);
    });
  }

  // allows a user to dynamically set a page number
  setPage(e: React.ChangeEvent<HTMLInputElement>): void {
    const parsed = parseInt(e.target.value, 10);
    this.turnToPage(isNaN(parsed) ? '' : parsed);
  }

  turnToPage(num: number | string): void {
    if (
      num === '' ||
      typeof num !== 'number' ||
      isNaN(num) ||
      num >= ctx.state.pages.length ||
      num < 0
    ) {
      return;
    }

    const content = ctx.state.pages[num];

    if (content === undefined) {
      return;
    }

    this.setState({ pageNumber: num }, () => {
      // use callback and write new content.
      ctx.props.updateCallback({
        content,
      });
    });
  }

  render() {
    const {
      currentFile,
      currentFileUrl,
      fileLoaded,
      pageNumber,
      pages,
      uploadError,
      loadingSampleId,
    } = this.state;

    return (
      <div className="FileParser-canvas">
        <StyledDropzone onDrop={this.onDrop} accept={allowedFiletypes} />

        {!fileLoaded ? (
          <div className="SampleBooks mt-3 text-sm">
            <p className="opacity-70 mb-1">Or try a public-domain sample:</p>
            <div className="flex flex-wrap gap-2">
              {CONSTANTS.SAMPLE_BOOKS.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className="btn btn-xs btn-outline"
                  disabled={loadingSampleId !== null}
                  onClick={() => {
                    this.loadSampleBook(book);
                  }}
                >
                  {loadingSampleId === book.id
                    ? 'Loading…'
                    : `${book.title} (${book.author})`}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {uploadError ? <p className="FileParser-error">{uploadError}</p> : null}

        {fileLoaded && currentFile && currentFile.type === EPUBTYPE ? (
          // render epub text!
          <div>
            <EpubParser
              file={currentFile}
              url={currentFileUrl}
              updateCallback={this.updateSettings}
              verbose={this.props.verbose}
            />
          </div>
        ) : (
          // else
          <span></span>
        )}

        {fileLoaded && currentFile && currentFile.type === PDFTYPE ? (
          // render PDF text!
          <div>
            <PDFParser
              file={currentFile}
              url={currentFileUrl}
              updateCallback={this.updateSettings}
              verbose={this.props.verbose}
            />
          </div>
        ) : (
          // else
          <span></span>
        )}

        {fileLoaded ? (
          <div style={{ display: 'inline-block' }}>
            <div
              className="arrow prev"
              onClick={() => {
                this.turnToPage(pageNumber - 1);
              }}
            >
              ‹
            </div>

            <p>
              Page : {pageNumber} / {pages.length}
            </p>

            <div
              className="arrow next"
              onClick={() => {
                this.turnToPage(pageNumber + 1);
              }}
            >
              ›
            </div>
          </div>
        ) : (
          // else
          <span></span>
        )}

        <div id="reader-fodder" />
      </div>
    );
  }
}

export default FileParser;
