import React, { Component } from "react";

import Reader from "../src/components/Reader/Reader";
import ModalWrapper from "../src/components/ModalWrapper/ModalWrapper";
import FileParser from "../src/components/FileParser/FileParser";

import ReactGA from "react-ga";

import * as CONSTANTS from "../src/components/constants";
import type { AppSettings } from "../src/components/types";

const DEBUG = false;

const READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
const START_COLOR = CONSTANTS.START_COLOR;
const STOP_COLOR = CONSTANTS.STOP_COLOR;

const initialContent = DEBUG ? CONSTANTS.EPICTETUS : CONSTANTS.INTRO_TEXT;
const scrollingEnabled = false;

const age = CONSTANTS.DEFAULT_AGE;

const verbose = DEBUG;

// public anyway.
const GOOGLE_ANALYTICS_KEY = "UA-96589312-4";

function initializeReactGA(): void {
  ReactGA.initialize(GOOGLE_ANALYTICS_KEY);
  ReactGA.pageview("/home");
}

interface AppState extends AppSettings {
  year: number;
  content: string;
}

class App extends Component<Record<string, never>, AppState> {
  constructor(props: Record<string, never>) {
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
      // Speed Writing (paper §8.4): opt-in, OFF by default. Deliberately
      // defaults to false here (rather than reading localStorage in the
      // constructor) so server-rendered and first-client-render markup
      // match; the real persisted value (if any) is picked up client-side
      // in componentDidMount, same pattern used for other browser-only
      // setup in this app (e.g. PDF.js worker init).
      speedWritingEnabled: false,
    };

    // set up our analytics on the first render

    initializeReactGA();
  }

  // Restore the user's saved readability metric choice after mount (avoids
  // an SSR/client hydration mismatch from reading localStorage up-front).
  componentDidMount(): void {
    if (typeof window === "undefined") {
      return;
    }

    const storedMetric = window.localStorage.getItem(
      CONSTANTS.READABILITY_METRIC_STORAGE_KEY
    );

    if (storedMetric && storedMetric !== this.state.readabilityMetric) {
      this.setState({ readabilityMetric: storedMetric });
    }

    try {
      const storedSpeedWriting = window.localStorage.getItem(
        CONSTANTS.SPEED_WRITING_STORAGE_KEY
      );

      if (storedSpeedWriting !== null) {
        this.setState({ speedWritingEnabled: storedSpeedWriting === "true" });
      }
    } catch {
      // localStorage unavailable (private browsing, disabled, etc) - keep
      // the safe (disabled) default.
    }
  }

  /*
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */
  updateSettings(newSettings: Partial<AppSettings>): void {
    if (
      typeof window !== "undefined" &&
      Object.prototype.hasOwnProperty.call(newSettings, "readabilityMetric") &&
      newSettings.readabilityMetric
    ) {
      window.localStorage.setItem(
        CONSTANTS.READABILITY_METRIC_STORAGE_KEY,
        newSettings.readabilityMetric
      );
    }

    this.setState(newSettings as Pick<AppState, keyof AppState>);
  }

  render() {
    return (
      <div className="App">
        <div className="row">
          <br />
          <Reader {...this.state} />

          <br />

          <FileParser
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
