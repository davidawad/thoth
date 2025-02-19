import React, { Component } from "react";
import LoadingBar from "react-top-loading-bar";
import ReactGA from "react-ga";

import {
  Editor,
  EditorState,
  ContentState,
  Modifier,
  RichUtils,
} from "draft-js";

import * as CONSTANTS from "../constants";

import TextParsingTools from "../TextParsingTools";
import utils from "../utils";
import PlaybackHead from "../PlaybackHead/PlaybackHead";
import DisplayReel from "../DisplayReel";

// import './Reader.css';

const PLAYPAUSE_KEY = CONSTANTS.PLAYPAUSE_KEY;

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;
let LARGEST_WORD_SIZE = CONSTANTS.LARGEST_WORD_SIZE;

const MAX_AGE = CONSTANTS.MAX_AGE;
const DEFAULT_AGE = CONSTANTS.DEFAULT_AGE;

const UNICODE_WHITESPACE = "\u00a0";

let ctx = {};

class Reader extends Component {
  constructor(props) {
    super(props);

    ctx = this;

    // bind functions for correct setState context
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.reset = this.reset.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.contentHandler = this.contentHandler.bind(this);
    this.propHandler = this.propHandler.bind(this);
    this.processCorpus = this.processCorpus.bind(this);
    // this.corpusStats = this.corpusStats.bind(this);
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
        ContentState.createFromText(this.props.content)
      ),
      currentReel: new DisplayReel('Press "Play".', -1, 1000),
      tape: this.parse(this.props.content),
      readingSpeed: READING_SPEED,
      enableSurroundingReels: true,
      displaySurroundingReels: true,

      scrollingEnabled: this.props.scrollingEnabled
        ? this.props.scrollingEnabled
        : false,

      highlightColor: "yellow",

      baseColorStop:
        typeof this.props.baseColorStop !== typeof undefined
          ? this.props.baseColorStop
          : "#00AD00",

      finalColorStop:
        typeof this.props.finalColorStop !== typeof undefined
          ? this.props.finalColorStop
          : "#0077AD",

      measurements: {},
      ageEstimate: DEFAULT_AGE,
    };
  }

  corpusStats(text) {
    const scores = TextParsingTools.generateTextScores(text);

    // console.log("READABILITY SCORES: ", scores )

    let res = 0;
    let total = 0;
    let numEntries = 0;

    for (let key in scores) {
      const val = scores[key];

      if (isFinite(val)) {
        numEntries++;
        total += val;
      }
    }

    // TODO add multiple models to a dropdown in the settings
    const agePredictionMode = "avg";

    switch (agePredictionMode) {
      case "avg":
        res = total / numEntries;
        break;

      case "mean":
        res = total / numEntries;
        break;

      default: // avg by default
        res = total / numEntries;
        break;
    }

    const age = res;

    this.setState({
      measurements: scores,
      ageEstimate: age,
    });
  }

  // when parent updates state, this component gets re-rendered
  componentWillReceiveProps(props) {
    this.setState(props, this.propHandler);
  }

  // required function for draft.js
  setEditor = (editor) => {
    this.editor = editor;
  };

  // change handler for draftjs, this strips out all the styles from the content and applies the new editor state.
  onEditorChange = function (editorState) {
    let text = "";

    // get plain text from the paste event
    const editorText = this.state.editorState
      .getCurrentContent()
      .getPlainText();

    text = editorText;

    // pass text along to content handler.
    this.contentHandler(text);

    this.setState({
      editorState: editorState,
    });
  };

  propHandler() {
    this.contentHandler(this.props.content, true);
  }

  // handler function for text pasted
  contentHandler(text, override) {
    if (ctx.state.verbose) {
      console.log("CONTENT HANDLER RECEIVED TEXT: ", text);
    }

    if (text === this.state.bodyText && override !== true) {
      if (ctx.state.verbose) {
        console.log("Content handler given Same Text as existing. Skipping");
      }
      return;
    }

    // pass text to internal processing
    this.processCorpus(text);

    this.setState({
      editorState: EditorState.createWithContent(
        ContentState.createFromText(text)
      ),
    });
  }

  // processes a new text sample and updates the state objects
  processCorpus(text) {
    if (ctx.state.verbose) {
      console.log("PARSING TEXT : ", text.substring(0, 20), "...");
      console.log("SPEED ON PROCESSCORPUS: ", this.state.readingSpeed);
    }

    this.corpusStats(text);

    let arr = this.parse(text);

    this.setState(
      {
        bodyText: text,
        tape: arr,
      },
      this.reset
    );
  }

  hyphenate(word) {
    let ret = word;
    let len = word.length;

    // TODO idfk why I can't tear this disgusting thing apart without it breaking
    // help wanted LOL.
    ret =
      len < MAX_DISPLAY_SIZE
        ? word
        : len < 11
        ? word.slice(0, len - 3) + "- " + word.slice(len - 3)
        : word.slice(0, 7) + "- " + this.hyphenate(word.slice(7));

    /*
    if(len < MAX_DISPLAY_SIZE) {
      ret = word;
    } else {
      if (len < 11) {
        word = word.slice(0, len - 3) + '- ' + word.slice(len - 3);
      } else {
        word = word.slice(0, 7) + '- ' + ctx.hyphenate(word.slice(7));
      }
    }
    */

    return ret;
  }

  // creates an array of DisplayReel Objects that contain the timing and other information for word display.
  timingBelt(words, str) {
    let focus;
    let word = str;
    let len = str.length;

    // focus point
    // start in middle of word (default focus point)
    // move left until you hit a vowel, then stop
    for (let j = (focus = ((len - 1) / 2) | 0); j >= 0; j--) {
      if (/[aeiou]/.test(str[j])) {
        focus = j;
        break;
      }
    }

    let speed = READING_SPEED;

    if (typeof this.state !== typeof undefined) {
      speed = Number(this.props.readingSpeed);
    }

    // time that this word will be displayed in milliseconds
    let t = 60000 / speed;

    // if t is over lenth of 6, increase time by 1/4th
    if (len > 6) {
      t += t / 4;
    }

    // if t has a comma, add half time
    if (~str.indexOf(",")) {
      t += t / 2;
    }

    // if t has a question mark / scale up by 1.5
    if (/[.?!]/.test(str)) {
      t += t * 1.5;
    }

    // if the word is easy according to the spache dictionary
    // better for younger readers
    if (TextParsingTools.easyWord(word)) {
      // pass for now
    }

    const wordIsPronoun =
      word.charAt(0) === word.charAt(0).toLowerCase() ? true : false;

    const punctuationStrippedWord =
      TextParsingTools.stripPunctuation(word).toLowerCase();

    // log out language parsing for word complexity
    // console.log("Before : ", TextParsingTools.familiarWord(word), word);
    // console.log("After : ", TextParsingTools.familiarWord(punctuationStrippedWord), punctuationStrippedWord);

    // if the word isn't familiar according to the dale-chall dictionary,
    // and is not a pronoun,
    // and has a length greater than 2, display it for longer
    if (
      !TextParsingTools.familiarWord(punctuationStrippedWord) &&
      !wordIsPronoun &&
      word.length > 2
    ) {
      // if the word isn't familiar give the user extra time.
      t += t * 1.5;
    }

    // scale the timing by a factor of the perceived text complexity
    // 1 + ((18 - 14.6) / 18)
    if (typeof this.state !== typeof undefined) {
      console.log("AGE: ", Number(ctx.state.ageEstimate));
      const ageWeighting =
        1 + (MAX_AGE - Number(ctx.state.ageEstimate)) / MAX_AGE;

      // t = t * ageWeighting;
    }

    let ret = words.concat([new DisplayReel(str, focus, t)]);

    // TODO I don't think this maximum was chosen scientifically whatsoever
    if (len > 14 || len - focus > 7) {
      ret = words.concat(this.parse(this.hyphenate(str)));
    }

    return ret;
  }

  // highlights entire editor and applies color gradient to it.
  setGradient() {
    let selection = undefined;

    let currentContent = this.state.editorState.getCurrentContent();

    selection = this.state.editorState.getSelection().merge({
      anchorKey: currentContent.getFirstBlock().getKey(),
      anchorOffset: 0,

      focusOffset: currentContent.getLastBlock().getText().length,
      focusKey: currentContent.getLastBlock().getKey(),
    });

    EditorState.forceSelection(this.state.editorState, selection);

    this.toggleColor("gradient", selection);
  }

  // highlight current selection!
  highlightSelection() {
    this.toggleColor(this.state.highlightColor);
  }

  // Toggles identified styles on the text in question.
  toggleColor(toggledColor, selection) {
    const { editorState } = this.state;

    if (typeof selection === typeof undefined) {
      selection = editorState.getSelection();
    }

    // Let's just allow one color at a time. Turn off all active colors.
    const nextContentState = Object.keys(this.colorStyleMap).reduce(
      (contentState, color) => {
        return Modifier.removeInlineStyle(contentState, selection, color);
      },
      editorState.getCurrentContent()
    );

    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      "change-inline-style"
    );

    const currentStyle = editorState.getCurrentInlineStyle();

    // Unset styles if they're enabled.
    if (selection.isCollapsed()) {
      nextEditorState = currentStyle.reduce((state, color) => {
        return RichUtils.toggleInlineStyle(state, color);
      }, nextEditorState);
    }

    // If the color is being toggled on, apply it.
    if (!currentStyle.has(toggledColor)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        toggledColor
      );
    }

    this.setState({ editorState: nextEditorState });
  }

  // parses a chunk of text into an array of DisplayReel objects that we can use for display
  parse(words) {
    const timingBelt = this.timingBelt;

    // strings will be broken out into words
    // find the focus point of the word
    // if, when the word is shifted to its focus point
    //   one end protrudes from either end more than 7 chars
    //   re-run parser after hyphenating the words

    // return array of displayReels
    return words
      .trim()
      .replace(/([.?!])([A-Z-])/g, "$1 $2")
      .split(/\s+/)
      .reduce(timingBelt, []);
  }

  // the "actual" play function.
  // Uses state information and begins rendering words through PlaybackHead
  loop() {
    let arr = this.state.tape;

    // are we at the end of the reading
    if (this.state.index === arr.length) {
      // pause & reset index when done reading

      this.setState({
        paused: true,
        index: 0,
      });

      ReactGA.event({
        category: "User",
        action: "User finished reading.",
      });

      return;
    }

    // STATE updates are bundled together!!
    if (this.state.paused) {
      return;
    }

    // word object
    const newReel = arr[this.state.index];

    this.setState({
      currentReel: newReel,
      index: this.state.index + 1,
    });

    // make recursive call
    let next_callback = function () {
      this.loop();
    }.bind(this); // make sure we can refer to parent context.

    setTimeout(next_callback, newReel.displayTime);
  }

  play() {
    // user hit play button
    ReactGA.event({
      category: "User",
      action: "Hit Play Button",
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
        }
      );
    }
  }

  pause() {
    this.setState({
      paused: true,
      displaySurroundingReels: true,
    });
  }

  // switch between paused & playing
  playpause() {
    if (this.state.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  handleKeyUp(event) {
    event.preventDefault();

    // use the space bar to play / pause reading session.
    if (event.keyCode === PLAYPAUSE_KEY) {
      // this.playpause();
    }
  }

  reset() {
    // pick index 0 and re-display that
    let reel = this.state.tape[0];

    this.setState({
      index: 0,
      currentReel: reel,
    });
  }

  render() {
    // TODO Move some of this out of here and into CSS classes?
    this.colorStyleMap = {
      yellow: {
        color: "rgba(180, 180, 0, 1.0)",
        fontWeight: "bold",
        className: "highlighted",
      },

      gradient: {
        background:
          "repeating-linear-gradient(90deg, rgba(2,0,36,1) 0%, " +
          this.state.baseColorStop +
          " 50%, " +
          this.state.finalColorStop +
          " 100%)",
        WebkitBackgroundClip: "text",
        BackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },

      current: {
        fontWeight: "bold",
        fontSize: "1.5em",
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

    let prevWord =
      typeof this.state.tape[this.state.index - 2] !== typeof undefined
        ? this.state.tape[this.state.index - 2].text
        : "";

    let postInd = this.state.index === 0 ? 1 : this.state.index;

    let postWord =
      typeof this.state.tape[postInd] !== typeof undefined
        ? this.state.tape[postInd].text
        : "";

    let preNumSpaces =
      typeof prevWord !== typeof undefined
        ? Math.max(LARGEST_WORD_SIZE - prevWord.length, 0)
        : 0;

    // let postNumSpaces  = typeof(postWord) !== typeof(undefined) ? LARGEST_WORD_SIZE - postWord.length : 0;

    // add white spaces
    let preWsp = Array(preNumSpaces).join(UNICODE_WHITESPACE);
    // let postWsp = Array(postNumSpaces).join(UNICODE_WHITESPACE);

    // scrolling text on render
    if (!this.state.paused && this.state.scrollingEnabled) {
      let scrollSelector =
        prevWord + " " + this.state.currentReel.text + " " + postWord;

      // seek through the text corpus as we read through it.
      let matching_element = Array.from(document.querySelectorAll("span")).find(
        (el) => el.textContent.includes(scrollSelector)
      );

      if (typeof matching_element !== typeof undefined) {
        // element is there, scroll to it.
        matching_element.scrollIntoView();
      }
    }

    return (
      <div className="Reader" onKeyUp={this.handleKeyUp}>
        <div className="">
          {this.state.enableSurroundingReels &&
          this.state.displaySurroundingReels ? (
            <span className="readerSurroundingWord">
              {preWsp}
              {prevWord}
            </span>
          ) : (
            <span>{Array(LARGEST_WORD_SIZE).join(UNICODE_WHITESPACE)}</span>
          )}
          {/* single space after pre-word */}
          <span className="readerSurroundingWord">{UNICODE_WHITESPACE}</span>
          <PlaybackHead currentReel={this.state.currentReel} />
          {/* single space before post-word */}
          <span className="readerSurroundingWord">{UNICODE_WHITESPACE}</span>
          {this.state.enableSurroundingReels &&
          this.state.displaySurroundingReels ? (
            <span className="readerSurroundingWord">{postWord}</span>
          ) : (
            <span></span>
          )}
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
          color={this.colorStyleMap.gradient.background}
        />

        <div className="editor" onClick={this.focusEditor}>
          <Editor
            ref={this.setEditor}
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            placeholder="Place your text content in here and press the play button!"
            enableLineBreak={true}
            spellcheck={false}
            stripPastedStyles={true}
            readOnly={!this.state.paused}
            customStyleMap={this.colorStyleMap}
          />
        </div>

        <p> Age Estimate : {this.state.ageEstimate} </p>
        <p>
          {" "}
          Reading : {this.state.index} / {this.state.tape.length}{" "}
        </p>
        <p>
          {" "}
          {utils.roundToPrecision(
            totalTimeEstimate - remainingTimeEstimate,
            0.01
          )}{" "}
          / {utils.roundToPrecision(totalTimeEstimate, 0.01)} seconds.{" "}
        </p>
      </div>
    );
  }
}

export default Reader;
