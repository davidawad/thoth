import React, { Component } from "react";

import Reader from "../src/components/Reader/Reader";
import ModalWrapper from "../src/components/ModalWrapper/ModalWrapper";
import FileParser from "../src/components/FileParser/FileParser";

import ReactGA from "react-ga";

import * as CONSTANTS from "../src/components/constants";

let DEBUG = process.env.NODE_ENV === "development";
DEBUG = false;

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let START_COLOR = CONSTANTS.START_COLOR;
let STOP_COLOR = CONSTANTS.STOP_COLOR;

const initialContent = DEBUG ? CONSTANTS.EPICTETUS : CONSTANTS.INTRO_TEXT;
let scrollingEnabled = DEBUG ? false : true;
scrollingEnabled = false;

let age = CONSTANTS.DEFAULT_AGE;

const verbose = DEBUG ? true : false;

// public anyway.
const GOOGLE_ANALYTICS_KEY = "UA-96589312-4";

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
      age: age,
      verbose: verbose,
      readabilityMetric: CONSTANTS.DEFAULT_READABILITY_METRIC,
    };

    // set up our analytics on the first render

    initializeReactGA();
  }

  // Restore the user's saved readability metric choice after mount (avoids
  // an SSR/client hydration mismatch from reading localStorage up-front).
  componentDidMount() {
    if (typeof window === "undefined") {
      return;
    }

    const storedMetric = window.localStorage.getItem(
      CONSTANTS.READABILITY_METRIC_STORAGE_KEY
    );

    if (storedMetric && storedMetric !== this.state.readabilityMetric) {
      this.setState({ readabilityMetric: storedMetric });
    }
  }

  /*
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */
  updateSettings(newSettings) {
    if (
      typeof window !== "undefined" &&
      Object.prototype.hasOwnProperty.call(newSettings, "readabilityMetric")
    ) {
      window.localStorage.setItem(
        CONSTANTS.READABILITY_METRIC_STORAGE_KEY,
        newSettings.readabilityMetric
      );
    }

    this.setState(newSettings);
  }

  render() {
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

          <ModalWrapper updateCallback={this.updateSettings} {...this.state} />
        </div>

        <footer>
          <p>
            Thoth is an{" "}
            <a href="https://github.com/davidawad/thoth">open source</a>{" "}
            <a href="http://arxiv.org/abs/1908.01699"> research project</a> by{" "}
            <a href="http://davidawad.com">David Awad</a>.
            <br /> &copy; {this.state.year}
          </p>
        </footer>
      </div>
    );
  }
}

export default App;
