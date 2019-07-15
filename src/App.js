import React, { Component } from 'react';

import Reader from './components/Reader/Reader';
import ModalWrapper from './components/ModalWrapper/ModalWrapper';
import FileParser from './components/FileParser/FileParser';

import * as CONSTANTS from './components/constants';

import './App.css';

let DEBUG = process.env.NODE_ENV === 'development';
DEBUG = false;

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let START_COLOR = CONSTANTS.START_COLOR;
let STOP_COLOR = CONSTANTS.STOP_COLOR;

// if debugging is enabled, use larger corpus and disable scrolling.
const initialContent = DEBUG ? CONSTANTS.EPICTETUS : CONSTANTS.INTRO_TEXT;
let scrollingEnabled = DEBUG ? false : true;

const verbose = DEBUG ? true : false;


class App extends Component {
  constructor(props) {
    super(props);

    this.updateSettings = this.updateSettings.bind(this);

    this.state = {
      year: new Date().getFullYear(),
      content: initialContent,
      readingSpeed: READING_SPEED,
      baseColorStop: START_COLOR,
      finalColorStop: STOP_COLOR,
      scrollingEnabled: scrollingEnabled,
      verbose: verbose
    };
  }

  /*
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */
  updateSettings(newSettings) {
    this.setState(newSettings);
  }

  render() {
    /*
      TODO take the query parameters from the URL and pass as initial text to the Reader Class using react router?
      https://stackoverflow.com/questions/29852998/getting-query-parameters-from-react-router-hash-fragment
    */

    return (
      <div className="App">
        <div className="row">
          <br />
          <Reader className="Reader" {...this.state} />

          <br />

          <FileParser
            className="App-FileParser"
            updateCallback={this.updateSettings}
            verbose={this.state.verbose}
          />

          <br />

          {/* Modal Tag to wrap our settings pane */}
          <ModalWrapper updateCallback={this.updateSettings} {...this.state} />
        </div>

        <footer>
          {/* TODO link to research paper when it's written. */}
          <p>
            Thoth is an{' '}
            <a href="https://github.com/davidawad/thoth">open source</a>{' '}
            research project by <a href="http://davidawad.com">David Awad</a>.
            <br /> &copy; {this.state.year}
          </p>
        </footer>
      </div>
    );
  }
}

export default App;
