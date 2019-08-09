import React, { Component } from 'react';

import Reader from './components/Reader/Reader';
import ModalWrapper from './components/ModalWrapper/ModalWrapper';
import FileParser from './components/FileParser/FileParser';

import ReactGA from 'react-ga';

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
scrollingEnabled = false;

let age = CONSTANTS.DEFAULT_AGE;

const verbose = DEBUG ? true : false;

// public anyway.
const GOOGLE_ANALYTICS_KEY = 'UA-96589312-4';

// const GOOGLE_ANALYTICS_KEY = process.env.THOTH_GA_KEY;

// google analytics activation, doesn't work 

function initializeReactGA() {
  ReactGA.initialize(GOOGLE_ANALYTICS_KEY);
  ReactGA.pageview("/home");
}



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
      age : age, 
      verbose: verbose
    };

    // set up our analytics on the first render
    
    initializeReactGA();
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
   // ReactGA.initialize(GOOGLE_ANALYTICS_KEY, { debug: DEBUG });
   // ReactGA.initialize(GOOGLE_ANALYTICS_KEY);

   

    return (
      <div className="App">
        <div className="row">
          <br />
          <Reader className="Reader" {...this.state} />

          <br />

          {/* File Parser so we can add content to the Reader. */}
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
            <a href="http://arxiv.org/abs/1908.01699"> research project</a> {' '}
            by <a href="http://davidawad.com">David Awad</a>.
            <br /> &copy; {this.state.year}
          </p>
        </footer>


      </div>
    );
  }
}

export default App;
