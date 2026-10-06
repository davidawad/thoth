import { DEFAULT_WPM } from '../Book/defaults';
import { Component } from 'react';
import { createPortal } from 'react-dom';
import LoadingBar from 'react-top-loading-bar';
import ReactGA from 'react-ga';

import {
  Editor,
  EditorState,
  Modifier,
  RichUtils,
  type DraftStyleMap,
} from 'draft-js';

import * as CONSTANTS from '../constants';

import TextParsingTools, { type ReadabilityScores } from '../TextParsingTools';
import SpeedWritingTools, { type Substitution } from '../SpeedWritingTools';
import utils from '../utils';
import {
  READER_EDITOR_KEY,
  createDeterministicContentState,
} from './deterministicContent';
import { hyphenateWord } from './hyphenate';
import {
  createDifficultyDecorator,
  DifficultyLegend,
} from './difficultyHighlight';
import SpeedControl from './SpeedControl';
import PlaybackHead from '../PlaybackHead/PlaybackHead';
import DisplayReel from '../DisplayReel';
import { wordDisplayTime } from './wordTiming';
import { currentPosition, focusIndex, surroundingWords } from './wordRow';
import type { AppSettings } from '../types';

const PLAYPAUSE_KEY = CONSTANTS.PLAYPAUSE_KEY;

const READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
const MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;

// How long typing must pause before the edited text is re-parsed / re-scored.
const COMMIT_DELAY_MS = 350;

const DEFAULT_AGE = CONSTANTS.DEFAULT_AGE;

// id of the sidebar slot (rendered by pages/index.tsx) that the reading
// stats (age estimate, progress, time) are portaled into - keeps them
// visually grouped with the book selector in the right-hand column while
// the underlying state/logic stays here, next to everything it depends on.
export const READER_STATS_PORTAL_ID = 'reader-stats-slot';

interface ReaderProps extends Partial<AppSettings> {
  content: string;
  /** Visible caption above the text box (the landing page sets one). */
  textLabel?: string;
  /** Called when the user moves the wpm slider (the parent persists it). */
  onSpeedChange?: (wpm: number) => void;
  /**
   * Called when playback reaches the end of the text. Return true if the
   * parent is loading more text (the next book page): playback then carries
   * on by itself instead of stopping.
   */
  onFinished?: () => boolean;
}

interface ReaderState {
  index: number;
  paused: boolean;
  bodyText: string;
  // What the tape was parsed from: bodyText, or its speed-writing rewrite.
  displayText: string;
  editorState: EditorState;
  currentReel: DisplayReel;
  tape: DisplayReel[];
  readingSpeed: number;
  scrollingEnabled: boolean;
  highlightColor: string;
  baseColorStop: string;
  finalColorStop: string;
  measurements: ReadabilityScores | Record<string, never>;
  ageEstimate: number;

  // Speed Writing (paper §8.4): populated by processCorpus whenever
  // props.speedWritingEnabled is on. Never populated silently - see
  // render() for how these are surfaced to the user.
  speedWritingActive: boolean;
  speedWritingSubstitutions: Substitution[];

  // DOM node (rendered by pages/index.tsx) that the stats block portals
  // into - null until componentDidMount finds it client-side.
  statsPortalTarget: Element | null;
}

let ctx: Reader;

class Reader extends Component<ReaderProps, ReaderState> {
  editor: Editor | null = null;
  loopTimer: ReturnType<typeof setTimeout> | null = null;
  commitTimer: ReturnType<typeof setTimeout> | null = null;
  // set when playback ran off the end of a page and the parent is supplying the next one
  continuePlaying = false;
  colorStyleMap: DraftStyleMap = {};

  constructor(props: ReaderProps) {
    super(props);

    ctx = this;

    // bind functions for correct setState context
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.playpause = this.playpause.bind(this);
    this.reset = this.reset.bind(this);
    this.handleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
    this.contentHandler = this.contentHandler.bind(this);
    this.propHandler = this.propHandler.bind(this);
    this.processCorpus = this.processCorpus.bind(this);
    this.applyProcessedText = this.applyProcessedText.bind(this);
    this.parse = this.parse.bind(this);
    this.hyphenate = this.hyphenate.bind(this);
    this.timingBelt = this.timingBelt.bind(this);
    this.toggleColor = this.toggleColor.bind(this);
    this.setEditor = this.setEditor.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
    this.highlightSelection = this.highlightSelection.bind(this);
    this.setGradient = this.setGradient.bind(this);

    const tape = this.parse(this.props.content);

    this.state = {
      index: 0,
      paused: true,
      bodyText: this.props.content,
      displayText: this.props.content,
      editorState: this.buildEditorState(this.props.content),
      // Start on the first word (as after Reset), so the head is never empty.
      currentReel: tape[0] ?? new DisplayReel('', -1, 1000),
      tape,
      readingSpeed: READING_SPEED,

      scrollingEnabled: this.props.scrollingEnabled
        ? this.props.scrollingEnabled
        : false,

      highlightColor: 'yellow',

      baseColorStop: this.props.baseColorStop ?? '#00AD00',

      finalColorStop: this.props.finalColorStop ?? '#0077AD',

      measurements: {},
      ageEstimate: DEFAULT_AGE,

      // Speed Writing (paper §8.4): populated by processCorpus whenever
      // props.speedWritingEnabled is on. Never populated silently - see
      // render() for how these are surfaced to the user.
      speedWritingActive: false,
      speedWritingSubstitutions: [],

      statsPortalTarget: null,
    };
  }

  corpusStats(text: string): void {
    const scores = TextParsingTools.generateTextScores(text);

    const metric =
      this.props.readabilityMetric || CONSTANTS.DEFAULT_READABILITY_METRIC;

    // if the user picked a specific formula (and it produced a real number),
    // use it directly. Otherwise fall back to averaging every finite metric -
    // this is also what "average" explicitly selects.
    let age: number;

    if (
      metric !== 'average' &&
      isFinite(scores[metric as keyof ReadabilityScores])
    ) {
      age = scores[metric as keyof ReadabilityScores];
    } else {
      let total = 0;
      let numEntries = 0;

      for (const key in scores) {
        const val = scores[key as keyof ReadabilityScores];

        if (isFinite(val)) {
          numEntries++;
          total += val;
        }
      }

      age = numEntries > 0 ? total / numEntries : DEFAULT_AGE;
    }

    this.setState({
      measurements: scores,
      ageEstimate: age,
    });
  }

  // Space bar toggles play/pause - but only when the user isn't actively
  // typing somewhere (the draft-js content editor, or any other focused
  // input), matching how media players (YouTube, Spotify, etc) scope
  // their spacebar shortcut. Attached globally on `document` rather than
  // via a React onKeyUp prop on a wrapper div, since that only fires when
  // a focusable descendant of that div already has focus - it wouldn't
  // catch a space press anywhere else on the page.
  componentDidMount(): void {
    document.addEventListener('keydown', this.handleGlobalKeyDown);

    this.setState({
      statsPortalTarget: document.getElementById(READER_STATS_PORTAL_ID),
    });
  }

  componentWillUnmount(): void {
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
    }
    if (this.commitTimer !== null) {
      clearTimeout(this.commitTimer);
    }
  }

  handleGlobalKeyDown(event: KeyboardEvent): void {
    if (event.code !== PLAYPAUSE_KEY) {
      return;
    }

    const active = document.activeElement;
    const isTypingTarget =
      active instanceof HTMLElement &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable);

    if (isTypingTarget) {
      return;
    }

    // prevent the page from scrolling on space bar - the whole point is
    // that space controls playback here, not the page.
    event.preventDefault();
    this.playpause();
  }

  // Update state when props change. Only reacts to props whose VALUES changed:
  // the parent re-renders for unrelated reasons (opening the Settings modal),
  // and treating that as a settings change would reset and reparse the text.
  componentDidUpdate(prevProps: ReaderProps): void {
    // Callback / slot props get a new identity on every parent render; they
    // are not settings and must never trigger a reparse.
    const NON_SETTINGS = ['onSpeedChange', 'onFinished', 'textLabel'];
    const changed = utils
      .changedKeys(prevProps, this.props)
      .filter((k) => !NON_SETTINGS.includes(String(k)));

    if (changed.length === 0) {
      return;
    }

    // Toggling the difficulty heat map only changes how the editor shows the
    // text - rebuild it around the CURRENT text rather than reloading the
    // original, so pasted or typed text isn't thrown away.
    if (changed.length === 1 && changed[0] === 'difficultyHighlightEnabled') {
      const currentText = this.state.editorState
        .getCurrentContent()
        .getPlainText();

      this.setState({ editorState: this.buildEditorState(currentText) });
      return;
    }

    // Moving the wpm slider re-times the words but must not lose your place
    // (or restart the page): rebuild the tape and keep the index.
    if (changed.length === 1 && changed[0] === 'readingSpeed') {
      this.setState({ tape: this.parse(this.state.displayText) });
      return;
    }

    const {
      content: _content,
      textLabel: _label,
      onSpeedChange: _a,
      onFinished: _b,
      ...settings
    } = this.props;
    this.setState(
      settings as Pick<ReaderState, keyof ReaderState>,
      this.propHandler,
    );
  }

  // required function for draft.js
  setEditor = (editor: Editor | null): void => {
    this.editor = editor;
  };

  // change handler for draftjs. The new editor state is applied untouched so
  // the caret never jumps (rebuilding it per keystroke is what made typing with
  // the heat-map decorator fragile). Edits are committed - tape, stats and the
  // decorator's scores refreshed - once typing pauses, or at once on Play.
  onEditorChange = (editorState: EditorState): void => {
    const edited =
      editorState.getCurrentContent() !==
      this.state.editorState.getCurrentContent();

    this.setState({ editorState });

    if (edited) {
      this.scheduleCommit();
    }
  };

  scheduleCommit(): void {
    if (this.commitTimer !== null) {
      clearTimeout(this.commitTimer);
    }

    this.commitTimer = setTimeout(() => this.commitEdit(), COMMIT_DELAY_MS);
  }

  // Applies the editor's current text: re-parse for playback and re-score the
  // heat map by swapping only the decorator (selection and content untouched).
  commitEdit(): void {
    if (this.commitTimer !== null) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }

    const text = this.state.editorState.getCurrentContent().getPlainText();

    if (text === this.state.bodyText) {
      return;
    }

    this.processCorpus(text);

    if (this.props.difficultyHighlightEnabled) {
      this.setState((s) => ({
        editorState: EditorState.set(s.editorState, {
          decorator: createDifficultyDecorator(text),
        }),
      }));
    }
  }

  propHandler(): void {
    this.contentHandler(this.props.content, true);
  }

  // handler function for text pasted
  contentHandler(text: string, override?: boolean): void {
    if (ctx.props.verbose) {
      console.log('CONTENT HANDLER RECEIVED TEXT: ', text);
    }

    if (text === this.state.bodyText && override !== true) {
      if (ctx.props.verbose) {
        console.log('Content handler given Same Text as existing. Skipping');
      }
      return;
    }

    // pass text to internal processing
    this.processCorpus(text);

    this.setState({
      editorState: this.buildEditorState(text),
    });
  }

  // Editor state for `text`; with the difficulty heat map on, each sentence is
  // tinted green (easy) to red (hard) by a decorator (see difficultyHighlight).
  buildEditorState(text: string): EditorState {
    const content = createDeterministicContentState(text);

    return this.props.difficultyHighlightEnabled
      ? EditorState.createWithContent(content, createDifficultyDecorator(text))
      : EditorState.createWithContent(content);
  }

  // processes a new text sample and updates the state objects
  processCorpus(text: string): void {
    if (ctx.props.verbose) {
      console.log('PARSING TEXT : ', text.substring(0, 20), '...');
      console.log('SPEED ON PROCESSCORPUS: ', this.state.readingSpeed);
    }

    this.corpusStats(text);

    // Speed Writing (paper §8.4): opt-in text simplification, applied once
    // per text load (not per-frame). This is an enhancement on top of the
    // base reader - it must never block or break normal reading, so every
    // path here (including failures) always ends by displaying *some*
    // valid tape.
    if (!this.props.speedWritingEnabled) {
      this.applyProcessedText(text, text, [], false);
      return;
    }

    SpeedWritingTools.substituteText(text)
      .then((result) => {
        this.applyProcessedText(
          text,
          result.text,
          result.substitutions,
          result.changed,
        );
      })
      .catch((err) => {
        if (ctx.props.verbose) {
          console.warn(
            'Speed Writing substitution failed, falling back to original text:',
            err,
          );
        }

        this.applyProcessedText(text, text, [], false);
      });
  }

  // shared tail-end of processCorpus: takes the original (source-of-truth)
  // text plus whatever text should actually be displayed/played (identical
  // to the source when speed writing is off or unavailable), builds the
  // display tape from it, and records what (if anything) was substituted.
  applyProcessedText(
    sourceText: string,
    displayText: string,
    substitutions: Substitution[],
    speedWritingActive: boolean,
  ): void {
    const arr = this.parse(displayText);

    this.setState(
      {
        bodyText: sourceText,
        displayText: displayText,
        tape: arr,
        speedWritingSubstitutions: substitutions,
        speedWritingActive: speedWritingActive,
      },
      () => {
        this.reset();
        // Page turned while playing (or auto-advanced at the end of a page):
        // keep going on the new page. loop() clears any pending timer first,
        // so a manual page turn never leaves two loops running.
        if (this.continuePlaying || !this.state.paused) {
          this.continuePlaying = false;
          if (this.loopTimer !== null) {
            clearTimeout(this.loopTimer);
          }
          this.setState({ paused: false }, () => this.loop());
        }
      },
    );
  }

  hyphenate(word: string): string {
    return hyphenateWord(word, MAX_DISPLAY_SIZE);
  }

  // creates an array of DisplayReel Objects that contain the timing and other information for word display.
  timingBelt(words: DisplayReel[], str: string): DisplayReel[] {
    const len = str.length;
    const focus = focusIndex(str);

    const t = wordDisplayTime(str, Number(this.props.readingSpeed));

    let ret = words.concat([new DisplayReel(str, focus, t)]);

    // note: these length thresholds are arbitrary, not empirically tuned
    if (len > 14 || len - focus > 7) {
      ret = words.concat(this.parse(this.hyphenate(str)));
    }

    return ret;
  }

  // highlights entire editor and applies color gradient to it.
  setGradient(): void {
    const currentContent = this.state.editorState.getCurrentContent();

    const selection = this.state.editorState.getSelection().merge({
      anchorKey: currentContent.getFirstBlock().getKey(),
      anchorOffset: 0,

      focusOffset: currentContent.getLastBlock().getText().length,
      focusKey: currentContent.getLastBlock().getKey(),
    });

    EditorState.forceSelection(this.state.editorState, selection);

    this.toggleColor('gradient', selection);
  }

  // highlight current selection!
  highlightSelection(): void {
    this.toggleColor(this.state.highlightColor);
  }

  // Toggles identified styles on the text in question.
  toggleColor(
    toggledColor: string,
    selection?: ReturnType<EditorState['getSelection']>,
  ): void {
    const { editorState } = this.state;

    const effectiveSelection = selection ?? editorState.getSelection();

    // Let's just allow one color at a time. Turn off all active colors.
    const nextContentState = Object.keys(this.colorStyleMap).reduce(
      (contentState, color) => {
        return Modifier.removeInlineStyle(
          contentState,
          effectiveSelection,
          color,
        );
      },
      editorState.getCurrentContent(),
    );

    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style',
    );

    const currentStyle = editorState.getCurrentInlineStyle();

    // Unset styles if they're enabled.
    if (effectiveSelection.isCollapsed()) {
      // immutable@3.7.6's .reduce() types the accumulator param as `R |
      // undefined` even with a seed value provided (an old, imprecise
      // declaration) - a seed (nextEditorState) is always passed below, so
      // this is never actually undefined at runtime.
      nextEditorState = currentStyle.reduce<EditorState>((state, color) => {
        return RichUtils.toggleInlineStyle(
          state as EditorState,
          color as string,
        );
      }, nextEditorState);
    }

    // If the color is being toggled on, apply it.
    if (!currentStyle.has(toggledColor)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        toggledColor,
      );
    }

    this.setState({ editorState: nextEditorState });
  }

  // parses a chunk of text into an array of DisplayReel objects that we can use for display
  parse(words: string): DisplayReel[] {
    const timingBelt = this.timingBelt;

    // strings will be broken out into words
    // find the focus point of the word
    // if, when the word is shifted to its focus point
    //   one end protrudes from either end more than 7 chars
    //   re-run parser after hyphenating the words

    // return array of displayReels
    return words
      .trim()
      .replace(/([.?!])([A-Z-])/g, '$1 $2')
      .split(/\s+/)
      .reduce(timingBelt, [] as DisplayReel[]);
  }

  // the "actual" play function.
  // Uses state information and begins rendering words through PlaybackHead
  loop(): void {
    const arr = this.state.tape;

    // are we at the end of the reading
    if (this.state.index === arr.length) {
      ReactGA.event({
        category: 'User',
        action: 'User finished reading.',
      });

      // In a book, the parent turns to the next page; playback then resumes
      // by itself once that page's tape is ready (see applyProcessedText).
      if (this.props.onFinished?.()) {
        this.continuePlaying = true;
        return;
      }

      // pause & reset index when done reading
      this.setState({
        paused: true,
        index: 0,
      });

      return;
    }

    // STATE updates are bundled together!!
    if (this.state.paused) {
      return;
    }

    // word object
    const newReel = arr[this.state.index];

    if (!newReel) {
      return;
    }

    this.setState({
      currentReel: newReel,
      index: this.state.index + 1,
    });

    // make recursive call
    const next_callback = () => {
      this.loop();
    };

    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
    }
    this.loopTimer = setTimeout(next_callback, newReel.displayTime);
  }

  play(): void {
    // user hit play button
    ReactGA.event({
      category: 'User',
      action: 'Hit Play Button',
    });

    // play what is in the editor right now, even if typing just stopped
    if (this.commitTimer !== null) {
      this.commitEdit();
    }

    // if paused, unpause and continue playing
    if (this.state.paused) {
      this.setState(
        {
          paused: false,
        },
        () => {
          this.loop();
        },
      );
    }
  }

  pause(): void {
    this.setState({
      paused: true,
    });
  }

  // switch between paused & playing
  playpause(): void {
    if (this.state.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  reset(): void {
    // pick index 0 and re-display that
    const reel = this.state.tape[0];

    if (!reel) {
      return;
    }

    this.setState({
      index: 0,
      currentReel: reel,
    });
  }

  renderSpeedControl() {
    const onChange = this.props.onSpeedChange;
    if (!onChange) {
      return null;
    }
    return (
      <SpeedControl
        wpm={Number(this.props.readingSpeed) || DEFAULT_WPM}
        onChange={onChange}
      />
    );
  }

  render() {
    this.colorStyleMap = {
      // draft-js's customStyleMap only supports real CSS properties, not a
      // className field (that was already inert - draft-js has no such
      // feature; removed rather than typed around).
      yellow: {
        color: 'rgba(180, 180, 0, 1.0)',
        fontWeight: 'bold',
      },

      gradient: {
        background:
          'repeating-linear-gradient(90deg, rgba(2,0,36,1) 0%, ' +
          this.state.baseColorStop +
          ' 50%, ' +
          this.state.finalColorStop +
          ' 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },

      current: {
        fontWeight: 'bold',
        fontSize: '1.5em',
      },
    };

    // estimate the amount of time it will take to read the entire text on screen
    let totalTimeEstimate = 0;

    // compute total display time for the text
    this.state.tape.forEach((reel) => {
      totalTimeEstimate += reel.displayTime;
    });

    let remainingTimeEstimate = 0;

    // compute remaining display time for the text
    this.state.tape.slice(this.state.index).forEach((reel) => {
      remainingTimeEstimate += reel.displayTime;
    });

    // convert to seconds
    totalTimeEstimate /= 1000;
    remainingTimeEstimate /= 1000;

    const position = currentPosition(
      this.state.tape,
      this.state.currentReel,
      this.state.index,
    );
    const { before: prevWord, after: postWord } = surroundingWords(
      this.state.tape,
      position,
    );

    // scrolling text on render
    if (!this.state.paused && this.state.scrollingEnabled) {
      const scrollSelector =
        prevWord + ' ' + this.state.currentReel.text + ' ' + postWord;

      // seek through the text corpus as we read through it.
      const matching_element = Array.from(
        document.querySelectorAll('span'),
      ).find((el) => (el.textContent || '').includes(scrollSelector));

      if (matching_element !== undefined) {
        // element is there, scroll to it.
        matching_element.scrollIntoView();
      }
    }

    const statsBlock = (
      <section className="readerStats" aria-label="Reading stats">
        <h3>Stats</h3>
        <dl>
          <div>
            <dt>Age estimate</dt>
            <dd>{Math.round(this.state.ageEstimate)} years</dd>
          </div>
          <div>
            <dt>Reading</dt>
            <dd>
              {this.state.index} / {this.state.tape.length} words
            </dd>
          </div>
          <div className="readerStatsWide">
            <dt>Time</dt>
            <dd>
              {utils.formatSeconds(totalTimeEstimate - remainingTimeEstimate)} /{' '}
              {utils.formatSeconds(totalTimeEstimate)} seconds
            </dd>
          </div>
        </dl>
      </section>
    );

    return (
      <div className="Reader">
        <div className="readerCard">
          <PlaybackHead
            currentReel={this.state.currentReel}
            before={prevWord}
            after={postWord}
          />

          <div className="readerControlsRow">
            <button
              type="button"
              className="btn btn-primary readerPlay"
              onClick={this.playpause}
              aria-keyshortcuts="Space"
            >
              {this.state.paused ? 'Play' : 'Pause'}
            </button>
            <button type="button" className="btn" onClick={this.reset}>
              Reset
            </button>
            {this.renderSpeedControl()}
          </div>
        </div>

        <LoadingBar
          progress={(this.state.index / this.state.tape.length) * 100}
          height={3}
          color={CONSTANTS.START_COLOR}
        />

        {this.props.textLabel ? (
          <p className="readerTextLabel" id="reader-text-label">
            {this.props.textLabel}
          </p>
        ) : null}
        <div className="editor">
          <Editor
            ariaLabel={this.props.textLabel ?? 'Text to read'}
            ref={this.setEditor}
            editorKey={READER_EDITOR_KEY}
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            placeholder="Place your text content in here and press the play button!"
            stripPastedStyles={true}
            readOnly={!this.state.paused}
            customStyleMap={this.colorStyleMap}
          />
        </div>

        <DifficultyLegend
          visible={Boolean(this.props.difficultyHighlightEnabled)}
        />

        {this.state.statsPortalTarget
          ? createPortal(statsBlock, this.state.statsPortalTarget)
          : statsBlock}

        {/*
          Speed Writing (paper §8.4): when enabled, show exactly what was
          changed - the paper explicitly flags the ethics of editing a
          user's text on their behalf, so this is never applied silently.
          Only rendered once speed writing has actually run for the current
          text (speedWritingActive), never just because the toggle is on.
        */}
        {this.state.speedWritingActive && (
          <div className="speedWritingSummary">
            {this.state.speedWritingSubstitutions.length > 0 ? (
              <>
                <p>
                  Speed Writing simplified{' '}
                  {this.state.speedWritingSubstitutions.length} word
                  {this.state.speedWritingSubstitutions.length === 1
                    ? ''
                    : 's'}{' '}
                  before reading (your original text above is unchanged):
                </p>
                <ul className="speedWritingSubstitutionList">
                  {this.state.speedWritingSubstitutions.map((sub, idx) => (
                    <li key={sub.original + '-' + idx}>
                      <span className="speedWritingOriginal">
                        {sub.original}
                      </span>
                      {' → '}
                      <span className="speedWritingReplacement">
                        {sub.replacement}
                      </span>
                      {sub.count > 1 ? ' (×' + sub.count + ')' : ''}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                Speed Writing is on, but no simpler synonyms were found for this
                text.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default Reader;
