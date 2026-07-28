import React, { Component } from 'react';
import LoadingBar from 'react-top-loading-bar';
import ReactGA from 'react-ga';

import {
  Editor,
  EditorState,
  ContentState,
  Modifier,
  RichUtils,
  type DraftStyleMap,
} from 'draft-js';

import * as CONSTANTS from '../constants';

import TextParsingTools, { type ReadabilityScores } from '../TextParsingTools';
import SpeedWritingTools, { type Substitution } from '../SpeedWritingTools';
import utils from '../utils';
import PlaybackHead from '../PlaybackHead/PlaybackHead';
import DisplayReel from '../DisplayReel';
import type { AppSettings } from '../types';

const PLAYPAUSE_KEY = CONSTANTS.PLAYPAUSE_KEY;

const READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
const MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;

const DEFAULT_AGE = CONSTANTS.DEFAULT_AGE;

interface ReaderProps extends Partial<AppSettings> {
  content: string;
}

interface ReaderState {
  index: number;
  paused: boolean;
  bodyText: string;
  editorState: EditorState;
  currentReel: DisplayReel;
  tape: DisplayReel[];
  readingSpeed: number;
  enableSurroundingReels: boolean;
  displaySurroundingReels: boolean;
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
}

let ctx: Reader;

class Reader extends Component<ReaderProps, ReaderState> {
  editor: Editor | null = null;
  colorStyleMap: DraftStyleMap = {};

  constructor(props: ReaderProps) {
    super(props);

    ctx = this;

    // bind functions for correct setState context
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
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

    this.state = {
      index: 0,
      paused: true,
      bodyText: this.props.content,
      editorState: EditorState.createWithContent(
        ContentState.createFromText(this.props.content),
      ),
      currentReel: new DisplayReel('Press "Play".', -1, 1000),
      tape: this.parse(this.props.content),
      readingSpeed: READING_SPEED,
      enableSurroundingReels: true,
      displaySurroundingReels: true,

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
  }

  componentWillUnmount(): void {
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
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

  // Update state when props change
  componentDidUpdate(prevProps: ReaderProps): void {
    if (this.props !== prevProps) {
      const { content: _content, ...settings } = this.props;
      this.setState(
        settings as Pick<ReaderState, keyof ReaderState>,
        this.propHandler,
      );
    }
  }

  // required function for draft.js
  setEditor = (editor: Editor | null): void => {
    this.editor = editor;
  };

  // change handler for draftjs, this strips out all the styles from the content and applies the new editor state.
  onEditorChange = (editorState: EditorState): void => {
    // get plain text from the paste event
    const text = this.state.editorState.getCurrentContent().getPlainText();

    // pass text along to content handler.
    this.contentHandler(text);

    this.setState({
      editorState: editorState,
    });
  };

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
      editorState: EditorState.createWithContent(
        ContentState.createFromText(text),
      ),
    });
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
        tape: arr,
        speedWritingSubstitutions: substitutions,
        speedWritingActive: speedWritingActive,
      },
      this.reset,
    );
  }

  hyphenate(word: string): string {
    const len = word.length;

    // fragile: rewriting this nested ternary tends to break hyphenation
    const ret =
      len < MAX_DISPLAY_SIZE
        ? word
        : len < 11
          ? word.slice(0, len - 3) + '- ' + word.slice(len - 3)
          : word.slice(0, 7) + '- ' + this.hyphenate(word.slice(7));

    return ret;
  }

  // creates an array of DisplayReel Objects that contain the timing and other information for word display.
  timingBelt(words: DisplayReel[], str: string): DisplayReel[] {
    let focus: number;
    const word = str;
    const len = str.length;

    // focus point
    // start in middle of word (default focus point)
    // move left until you hit a vowel, then stop
    for (let j = (focus = ((len - 1) / 2) | 0); j >= 0; j--) {
      if (/[aeiou]/.test(str[j] ?? '')) {
        focus = j;
        break;
      }
    }

    const speed = Number(this.props.readingSpeed);

    // time that this word will be displayed in milliseconds
    let t = 60000 / speed;

    // if t is over lenth of 6, increase time by 1/4th
    if (len > 6) {
      t += t / 4;
    }

    // if t has a comma, add half time
    if (~str.indexOf(',')) {
      t += t / 2;
    }

    // if t has a question mark / scale up by 1.5
    if (/[.?!]/.test(str)) {
      t += t * 1.5;
    }

    const wordIsPronoun = word.charAt(0) === word.charAt(0).toLowerCase();

    const punctuationStrippedWord =
      TextParsingTools.stripPunctuation(word).toLowerCase();

    // Scale the display time continuously by how difficult the word is
    // (syllable count + dictionary-familiarity tier), rather than applying
    // a single fixed multiplier to every "unfamiliar" word. Pronouns and
    // very short words are excluded, same as before.
    if (!wordIsPronoun && word.length > 2) {
      t *= TextParsingTools.wordDifficultyMultiplier(punctuationStrippedWord);
    }

    // TODO scale the timing by a factor of the perceived text complexity:
    // t = t * (1 + (MAX_AGE - Number(ctx.state.ageEstimate)) / MAX_AGE)

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
      // pause & reset index when done reading

      this.setState({
        paused: true,
        index: 0,
      });

      ReactGA.event({
        category: 'User',
        action: 'User finished reading.',
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

    setTimeout(next_callback, newReel.displayTime);
  }

  play(): void {
    // user hit play button
    ReactGA.event({
      category: 'User',
      action: 'Hit Play Button',
    });

    // if paused, unpause and continue playing
    if (this.state.paused) {
      this.setState(
        {
          paused: false,
          displaySurroundingReels: false,
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
      displaySurroundingReels: true,
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

    const prevReel = this.state.tape[this.state.index - 2];
    const prevWord = prevReel !== undefined ? prevReel.text : '';

    const postInd = this.state.index === 0 ? 1 : this.state.index;

    const postReel = this.state.tape[postInd];
    const postWord = postReel !== undefined ? postReel.text : '';

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

    return (
      <div className="Reader">
        <div className="readerWordRow">
          <span className="readerSurroundingWord readerSurroundingWord--before">
            {this.state.enableSurroundingReels &&
            this.state.displaySurroundingReels
              ? prevWord
              : ''}
          </span>
          <PlaybackHead currentReel={this.state.currentReel} />
          <span className="readerSurroundingWord readerSurroundingWord--after">
            {this.state.enableSurroundingReels &&
            this.state.displaySurroundingReels
              ? postWord
              : ''}
          </span>
          <br />
          <br />
          <button className="btn" onClick={this.play}>
            Play
          </button>
          &nbsp;
          <button className="btn" onClick={this.pause}>
            Pause
          </button>
          &nbsp;
          <button className="btn" onClick={this.reset}>
            Reset
          </button>
          &nbsp;
          <button className="btn" onClick={this.highlightSelection}>
            Highlight
          </button>
          &nbsp;
          <button className="btn" onClick={this.setGradient}>
            Gradient
          </button>
        </div>

        <br />

        <LoadingBar
          progress={(this.state.index / this.state.tape.length) * 100}
          height={3}
          color={CONSTANTS.START_COLOR}
        />

        <div className="editor">
          <Editor
            ref={this.setEditor}
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            placeholder="Place your text content in here and press the play button!"
            stripPastedStyles={true}
            readOnly={!this.state.paused}
            customStyleMap={this.colorStyleMap}
          />
        </div>

        <p> Age Estimate : {this.state.ageEstimate} </p>
        <p>
          {' '}
          Reading : {this.state.index} / {this.state.tape.length}{' '}
        </p>
        <p>
          {' '}
          {utils.roundToPrecision(
            totalTimeEstimate - remainingTimeEstimate,
            0.01,
          )}{' '}
          / {utils.roundToPrecision(totalTimeEstimate, 0.01)} seconds.{' '}
        </p>

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
