import React, { Component } from 'react';

import {
  Editor,
  EditorState,
  ContentState,
  Modifier,
  RichUtils
  //SelectionState,
  // convertFromHTML,
} from 'draft-js';

// import {useRef, useEffect} from 'react';
// import diff from 'deep-diff'

import './Reader.css';
// import '../Editor/Editor.css';
import PlaybackHead from '../PlaybackHead/PlaybackHead';
import DisplayReel from '../DisplayReel';
// import SettingsPanel from '../SettingsPanel/SettingsPanel';

import LoadingBar from 'react-top-loading-bar';

import * as CONSTANTS from '../constants';

const PLAYPAUSE_KEY = CONSTANTS.PLAYPAUSE_KEY;

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;
let LARGEST_WORD_SIZE = CONSTANTS.LARGEST_WORD_SIZE;

let DEBUG = process.env.NODE_ENV === 'development';

class Reader extends Component {
  constructor(props) {
    super(props);

    // bind functions for correct setState context
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.reset = this.reset.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.contentHandler = this.contentHandler.bind(this);
    this.propHandler = this.propHandler.bind(this);
    this.processCorpus = this.processCorpus.bind(this);
    this.parse = this.parse.bind(this);
    this.hyphenate = this.hyphenate.bind(this);
    this.timingBelt = this.timingBelt.bind(this);
    this.toggleColor = this.toggleColor.bind(this);
    this.setEditor = this.setEditor.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);

    this.highlightSelection = this.highlightSelection.bind(this);
    this.setGradient = this.setGradient.bind(this);

    //this.toggleColor = (toggledColor) => this._toggleColor(toggledColor);

    // const ctx = this;

    this.state = {
      index: 0,
      paused: true,
      bodyText: this.props.content,
      editorState: EditorState.createWithContent(
        ContentState.createFromText(this.props.content)
      ),
      currentReel: new DisplayReel('Press "Play".', -1, 1000),
      corpusArr: this.parse(this.props.content),
      readingSpeed: READING_SPEED,
      enableSurroundingReels: true,
      displaySurroundingReels: true,

      scrollingEnabled: this.props.scrollingEnabled
        ? this.props.scrollingEnabled
        : false,

      highlightColor: 'yellow',

      baseColorStop:
        typeof this.props.baseColorStop !== typeof undefined
          ? this.props.baseColorStop
          : '#00AD00',

      finalColorStop:
        typeof this.props.finalColorStop !== typeof undefined
          ? this.props.finalColorStop
          : '#0077AD'
    };
  }

  // when parent updates state, this component gets re-rendered
  componentWillReceiveProps(someProps) {
    console.log('fuck', someProps);
    if (typeof someprops === typeof undefined) {
      return;
    }
    this.setState(...someProps, this.propHandler(someProps));
  }

  // when parent updates state, this component gets re-rendered
  /*
  componentWillReceiveProps(props) {
    console.log("READER RECEIVED PROPS: ", props);

    let newText = props.content;

    this.setState(props, this.propHandler(props));
    
  }
  */

  // setEditor function for draftjs
  setEditor = editor => {
    this.editor = editor;
  };

  // paste handler for drafjs, this strips out all the styles from the content.
  onEditorChange = function(editorState) {
    let text = '';

    // get plain text from the paste event
    const editorText = this.state.editorState
      .getCurrentContent()
      .getPlainText();

    // if the current text in the editor isn't the same as the state bodyText, the user just edited it.
    // if the prop to the component isn't the same as the current body text, it's been edited as well.

    // it's possible for the user to edit the text passed a content prop to this component

    let textEdited = editorText !== this.state.bodyText;

    if (textEdited) {
      console.log('no text change from editor');
      return;
    }

    text = editorText;

    // pass text along to new content handler.
    this.contentHandler(text);

    // read new state information.

    // not sure why this works but whatever.
    this.setState({
      editorState: editorState
    });
  };

  propHandler(props) {
    console.log('PROPS GIVEN TO PROP HANDLER : ', props);
    this.contentHandler(props.content, true);
  }

  // handler function for text pasted
  contentHandler(text, override) {
    console.log('CONTENT HANDLER');

    if (text === this.state.bodyText && override !== true) {
      console.log('Content handler given Same Text as existing. Skipping');
      return;
    }

    // pass text to internal processing
    this.processCorpus(text);

    this.setState({
      editorState: EditorState.createWithContent(
        ContentState.createFromText(text)
      )
    });
  }

  // TODO combine processCorpus and contentHandler
  // processes a new text sample and updates the state objects
  processCorpus(text) {
    console.log('PARSING TEXT : ', text.substring(0, 20), '...');

    console.log('SPEED ON PROCESSCORPUS: ', this.state.readingSpeed);
    let arr = this.parse(text);

    this.setState({
      bodyText: text,
      corpusArr: arr
    });
  }

  hyphenate(word) {
    let ret = word;
    let len = word.length;

    // TODO idfk why I can't tear this disgusting thing apart without it breaking
    ret =
      len < MAX_DISPLAY_SIZE
        ? word
        : len < 11
        ? word.slice(0, len - 3) + '- ' + word.slice(len - 3)
        : word.slice(0, 7) + '- ' + this.hyphenate(word.slice(7));

    // if (len >= 7 && len < 11) {
    // ret = word.slice(0, len - 3) + '- ' + word.slice(len - 3)
    // }

    // if (len > 11) {
    // ret = word.slice(0, 7) + '- ' + hyphenate(word.slice(7))
    // }

    return ret;
  }

  timingBelt = function(words, str) {
    let focus;
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

    // time that this word will be displayed in milliseconds
    // let t = 60000 / 700;

    let speed = READING_SPEED;

    if (typeof this.state !== typeof undefined) {
      speed = Number(this.props.readingSpeed);
      console.log('SPEED IS : ', speed);
    }

    let t = 60000 / speed;

    if (len > 6) {
      t += t / 4;
    }

    if (~str.indexOf(',')) {
      t += t / 2;
    }

    if (/[.?!]/.test(str)) {
      t += t * 1.5;
    }

    let ret = words.concat([new DisplayReel(str, focus, t)]);

    if (len > 14 || len - focus > 7) {
      ret = words.concat(this.parse(this.hyphenate(str)));
    }

    return ret;
  };

  // TODO better abstractions

  // highlights entire editor and applies color gradient to it.
  setGradient() {
    // TODO force selection of entire text. Not working.
    // TODO try https://github.com/facebook/draft-js/issues/1386

    // better way to construct entire selection :
    // https://github.com/facebook/draft-js/issues/2122

    let selection = undefined;

    /*
    let selection = editorState.getSelection().merge({
      // anchorOffset: 0,
      focusOffset: 7,  // WATCH THE OFFSET.
    })

    let DEBUG = selection;

    let forcedEditorState = EditorState.forceSelection(editorState, selection);

    selection = forcedEditorState.getSelection();
    
    console.log("BEFORE")  
    console.log(selection)
    
    console.log("AFTER")    
    console.log(selection)

    console.log("DIFF: ", diff(DEBUG, selection));
    */

    let highlightColor = 'gradient';
    this.toggleColor(highlightColor, selection);
  }

  // highlight current selection!
  highlightSelection() {
    this.toggleColor(this.state.highlightColor);
  }

  // Toggles identified styles on the text in question.
  toggleColor(toggledColor, selection) {
    // let toggledColor = 'gradient';

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
      'change-inline-style'
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

  // parses a chunk of text into an array of objects that we can use for display
  parse = function(words) {
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
      .reduce(timingBelt, []);
  };

  // the "actual" play function.
  // Uses state information and begins rendering words through PlaybackHead
  loop() {
    let arr = this.state.corpusArr;

    // are we at the end of the reading
    if (this.state.index === arr.length) {
      // pause & reset index when done reading

      this.setState({
        paused: true,
        index: 0
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
      index: this.state.index + 1
    });

    // make recursive call
    let next_callback = function() {
      this.loop();
    }.bind(this); // make sure we can refer to parent context.

    setTimeout(next_callback, newReel.displayTime);
  }

  play() {
    // if paused, unpause and continue playing
    if (this.state.paused) {
      this.setState(
        {
          paused: false,
          displaySurroundingReels: false
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
      displaySurroundingReels: true
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
    if (event.keyCode === PLAYPAUSE_KEY && !DEBUG) {
      // toggle play_pause
      this.playpause();
    }
  }

  reset() {
    // pick index 0 and re-display that
    let reel = this.state.corpusArr[0];
    this.setState({
      index: 0,
      currentReel: reel
    });
  }

  // TODO remove this?
  /*
  onLoaderFinished = () => {
    this.setState({ loadingBarProgress: 0 });
  };
  */

  render() {
    // TODO Move some of this out of here and into CSS classes?
    this.colorStyleMap = {
      yellow: {
        color: 'rgba(180, 180, 0, 1.0)',
        fontWeight: 'bold',
        className: 'highlighted'
      },

      gradient: {
        background:
          'repeating-linear-gradient(90deg, rgba(2,0,36,1) 0%, ' +
          this.state.baseColorStop +
          ' 50%, ' +
          this.state.finalColorStop +
          ' 100%)',
        WebkitBackgroundClip: 'text',
        BackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }
    };

    let prevWord =
      typeof this.state.corpusArr[this.state.index - 2] !== typeof undefined
        ? this.state.corpusArr[this.state.index - 2].text
        : '';
    let postWord =
      typeof this.state.corpusArr[this.state.index] !== typeof undefined
        ? this.state.corpusArr[this.state.index].text
        : '';

    let preNumSpaces =
      typeof prevWord !== typeof undefined
        ? Math.max(LARGEST_WORD_SIZE - prevWord.length, 0)
        : 0;
    // let postNumSpaces  = typeof(postWord) !== typeof(undefined) ? LARGEST_WORD_SIZE - postWord.length : 0;

    // add white spaces
    let preWsp = Array(preNumSpaces).join('\u00a0');
    // let postWsp = Array(postNumSpaces).join("\u00a0");

    // scrolling text on render
    if (!this.state.paused && this.state.scrollingEnabled) {
      let scrollSelector =
        prevWord + ' ' + this.state.currentReel.text + ' ' + postWord;

      // seek through the text corpus as we read through it.
      let matching_element = Array.from(document.querySelectorAll('span')).find(
        el => el.textContent.includes(scrollSelector)
      );

      if (typeof matching_element !== typeof undefined) {
        // element is there, scroll to it.
        matching_element.scrollIntoView();
      }
    }

    return (
      <div className="Reader" onKeyUp={this.handleKeyUp}>
        <br />
        <br />
        <br />

        <div className="">
          {this.state.enableSurroundingReels &&
          this.state.displaySurroundingReels ? (
            <span className="readerSurroundingWord">
              {preWsp}
              {prevWord}
            </span>
          ) : (
            <span>{Array(LARGEST_WORD_SIZE).join('\u00a0')}</span>
          )}
          {/* single space after pre-word */}
          <span className="readerSurroundingWord">{'\u00a0'}</span>
          <PlaybackHead currentReel={this.state.currentReel} />
          {/* single space before post-word */}
          <span className="readerSurroundingWord">{'\u00a0'}</span>
          {this.state.enableSurroundingReels &&
          this.state.displaySurroundingReels ? (
            <span className="readerSurroundingWord">{postWord}</span>
          ) : (
            <span></span>
          )}
          <br />
          <br />
          <button onClick={this.play}>Play</button>
          &nbsp;
          <button onClick={this.pause}>Pause</button>
          &nbsp;
          <button onClick={this.reset}>Reset</button>
          &nbsp;
          <button onClick={this.highlightSelection}>Highlight</button>
          &nbsp;
          <button onClick={this.setGradient}>Gradient</button>
        </div>

        <br />

        {/*
          TODO convert loading bars to a css gradient! 
          See github issue here : https://github.com/klendi/react-top-loading-bar/issues/6 
        */}
        <LoadingBar
          progress={(this.state.index / this.state.corpusArr.length) * 100}
          height={3}
          color="red"
        />

        <div className="editor" onClick={this.focusEditor}>
          <Editor
            // className={"EditorRoot " + (this.state.paused ? "" : ' ReaderScroll') }
            ref={this.setEditor}
            editorState={this.state.editorState}
            onChange={this.onEditorChange}
            // onPaste={this.onEditorPaste}
            placeholder="Place your text content in here and press the play button!"
            enableLineBreak={true}
            spellcheck={false}
            showUndoControl={true}
            showRedoControl={true}
            stripPastedStyles={true}
            readOnly={!this.state.paused}
            customStyleMap={this.colorStyleMap}
          />
        </div>
      </div>
    );
  }
}

export default Reader;
