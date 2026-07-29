import { Component } from 'react';

import Reader, {
  READER_STATS_PORTAL_ID,
} from '../src/components/Reader/Reader';
import ModalWrapper from '../src/components/ModalWrapper/ModalWrapper';
import FileParser from '../src/components/FileParser/FileParser';

import ReactGA from 'react-ga';

import * as CONSTANTS from '../src/components/constants';
import {
  readabilityMetricSchema,
  storedBooleanSchema,
} from '../src/components/schemas';
import type { AppSettings } from '../src/components/types';

const DEBUG = false;

const READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
const START_COLOR = CONSTANTS.START_COLOR;
const STOP_COLOR = CONSTANTS.STOP_COLOR;

const initialContent = DEBUG ? CONSTANTS.EPICTETUS : CONSTANTS.INTRO_TEXT;
const scrollingEnabled = false;

const age = CONSTANTS.DEFAULT_AGE;

const verbose = DEBUG;

// public anyway.
const GOOGLE_ANALYTICS_KEY = 'UA-96589312-4';

function initializeReactGA(): void {
  ReactGA.initialize(GOOGLE_ANALYTICS_KEY);
  ReactGA.pageview('/home');
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
    if (typeof window === 'undefined') {
      return;
    }

    const storedMetric = window.localStorage.getItem(
      CONSTANTS.READABILITY_METRIC_STORAGE_KEY,
    );
    const parsedMetric = readabilityMetricSchema.safeParse(storedMetric);

    if (
      parsedMetric.success &&
      parsedMetric.data !== this.state.readabilityMetric
    ) {
      this.setState({ readabilityMetric: parsedMetric.data });
    }

    try {
      const storedSpeedWriting = window.localStorage.getItem(
        CONSTANTS.SPEED_WRITING_STORAGE_KEY,
      );
      const parsedSpeedWriting =
        storedBooleanSchema.safeParse(storedSpeedWriting);

      if (parsedSpeedWriting.success) {
        this.setState({ speedWritingEnabled: parsedSpeedWriting.data });
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
      typeof window !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(newSettings, 'readabilityMetric') &&
      newSettings.readabilityMetric
    ) {
      window.localStorage.setItem(
        CONSTANTS.READABILITY_METRIC_STORAGE_KEY,
        newSettings.readabilityMetric,
      );
    }

    this.setState(newSettings as Pick<AppState, keyof AppState>);
  }

  render() {
    return (
      <div className="App">
        {/* Equal-width spacer + sidebar columns either side of `main` keep
            the reader visually centered on the page - it's the star of the
            show, not something the sidebar should shove off-center. Spacer
            is hidden below `lg`, where the sidebar drops beneath `main`
            instead of sitting next to it. */}
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)_20rem] gap-8 items-start">
          <div className="hidden lg:block" aria-hidden="true" />

          <main className="min-w-0">
            <Reader {...this.state} />
          </main>

          <aside className="flex flex-col gap-4">
            <div id={READER_STATS_PORTAL_ID} className="contents" />

            <FileParser
              updateCallback={this.updateSettings}
              verbose={this.state.verbose}
            />
          </aside>
        </div>

        <footer className="mt-10 py-4 text-center text-xs opacity-60">
          <p>
            Thoth is an{' '}
            <a href="https://github.com/davidawad/thoth" className="link">
              open source
            </a>{' '}
            <a href="http://arxiv.org/abs/1908.01699" className="link">
              research project
            </a>{' '}
            by{' '}
            <a href="http://davidawad.com" className="link">
              David Awad
            </a>{' '}
            &copy; {this.state.year}
          </p>
        </footer>

        <div className="fixed bottom-4 right-4 z-40">
          <ModalWrapper updateCallback={this.updateSettings} {...this.state} />
        </div>
      </div>
    );
  }
}

export default App;
