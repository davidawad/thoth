import React, { Component } from 'react';

import {Editor, EditorState, ContentState} from 'draft-js';

import './Reader.css';
// import '../Editor/Editor.css';
import PlaybackHead from '../PlaybackHead/PlaybackHead';
import DisplayReel from '../DisplayReel';
// import SettingsPanel from '../SettingsPanel/SettingsPanel';
import ModalWrapper from '../ModalWrapper/ModalWrapper';


import * as CONSTANTS from '../constants';

const SPACE_KEY = CONSTANTS.SPACE_KEY; 

const styles = {
  editor: {
    border: '1px solid gray',
    minHeight: '20em',
    padding: '20px'
  }
};


let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;
let LARGEST_WORD_SIZE = CONSTANTS.LARGEST_WORD_SIZE;



class Reader extends Component {  

  constructor(props) {

    super(props);

    // bind functions for correct setState context
    this.play  = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.reset = this.reset.bind(this);
    this.parse = this.parse.bind(this);
    this.hyphenate = this.hyphenate.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.pasteHandler = this.pasteHandler.bind(this);

    const ctx = this;
    this.onChange = function(editorState) {
      ctx.pasteHandler();
      // read new state information.
      ctx.setState({editorState})
    };

    this.setEditor = (editor) => {
      this.editor = editor;
    };

    this.state = {
      index: 0,
      paused: true,
      bodyText: this.props.initialContent,
      editorState: EditorState.createWithContent(ContentState.createFromText(this.props.initialContent)),
      currentReel: new DisplayReel('Press "Play".', -1, 1000),
      corpusArr: this.parse(this.props.initialContent),
      readingSpeed: READING_SPEED,
      readOnly: false,
      enableSurroundingReels: true,
      displaySurroundingReels: true,
    };

  }



  hyphenate(word) {

    let ret = word
    let len = word.length

    // console.log(word, len)

    // TODO idfk why I can't tear this disgusting thing apart without it breaking
    ret = len < MAX_DISPLAY_SIZE ? word : len < 11 ? word.slice(0, len - 3) + '- ' + word.slice(len - 3) : word.slice(0,7) + '- ' + this.hyphenate(word.slice(7))

    // if (len >= 7 && len < 11) {
        // ret = word.slice(0, len - 3) + '- ' + word.slice(len - 3)
    // }

    // if (len > 11) {
        // ret = word.slice(0, 7) + '- ' + hyphenate(word.slice(7))
    // }


    return ret
  }


  parse(words) {

    // defining due to fucking stupid function definition problems
    let parse = this.parse;
    let hyphenate = this.hyphenate;

    // Logic
    // strings will be broken out into words
    // find the focus point of the word
    // if, when the word is shifted to its focus point
    //   one end prodtrudes from either end more than 7 chars
    //   re-run parser after hyphenating the words

    // focus point
    // start in middle of word (default focus point)
    // move left until you hit a vowel, then stop

    // return 2d array with word and focus point
    return words.trim()
        .replace(/([.?!])([A-Z-])/g, '$1 $2')
        .split(/\s+/)
        .reduce(function(words, str) {

            let focus
            let len = str.length

            // focus point is typically going to be
            // the first vowel in the word
            for (let j = focus = (len - 1) / 2 | 0; j >= 0;  j--) {

                if (/[aeiou]/.test(str[j])) {
                    focus = j
                    break
                }
            }

            // time that this word will be displayed
            let t = 60000 / READING_SPEED

            if (len > 6) {
                t += t/4
            }

            if (~str.indexOf(',')) {
                t += t/2
            }

            if (/[.?!]/.test(str)) {
                t += t * 1.5
            }

            // let ret = words.concat([[str, focus, t]])
            let ret = words.concat([new DisplayReel(str, focus, t)])

            if (len > 14 || len - focus > 7 ) {
                ret = words.concat(parse(hyphenate(str)))
            }

            return ret

        }, [])
  }


// the "actual" play function. 
// Uses state information and begins rendering words through PlaybackHead
  loop() {

    let arr = this.state.corpusArr;

    // console.log("looping", arr, this.state.corpusArr)

    // are we at the end of the reading
    if (this.state.index === arr.length) {
      // pause & reset index when done reading
      console.log("Done Reading");

      this.setState({
        paused: true,
        index: 0,
        readOnly: false,
      })

      return;
    }

    // STATE updates are bundled together!! 
    if (this.state.paused) { 
      return 
    }

    // word object
    const newReel = arr[this.state.index]

    this.setState({
      currentReel: newReel,
      index: (this.state.index + 1),
    })

    // make recursive call    
    let next_callback = function() { 
      this.loop() 
    }.bind(this); // make sure we can refer to parent context.
    
    setTimeout(next_callback, newReel.displayTime)
  }

  play () {

    // if paused, unpause and continue playing
    if (this.state.paused) {
      
      this.setState({
        paused: false,
        readOnly: false,
        displaySurroundingReels: false,
      }, () => {this.loop()})

      return;
    }

    // play from beginning to end. 
    this.loop()
  }

  pause () {

    this.setState({
      paused: true,
      readOnly: false,
      displaySurroundingReels: true,
    })
  }

  // switch between paused & playing
  playpause() {
    if (this.state.paused) {
        this.play()
    } else {
        this.pause()
    }
  }

  handleKeyUp(event) {
    event.preventDefault();

    // use the space bar to play / pause reading session.
    if(event.keyCode === SPACE_KEY){

      // toggle play_pause
      this.playpause()
    }
  }

  reset() {
    // pick index 0 and re-display that
    let reel = this.state.corpusArr[0];
    this.setState({
      index: 0,
      currentReel: reel,
    })
  }


  // TODO not necessary anymore?
  pasteHandler(){
    let text = '';
    let arr = [];

    // get plain text from the paste event
    text = this.state.editorState.getCurrentContent().getPlainText();
    arr = this.parse(text);

    this.setState({
      "bodyText": text,
      "corpusArr" : arr,
    })
  }


  render() {

    let prevWord = typeof(this.state.corpusArr[this.state.index - 2]) !== typeof(undefined) ? this.state.corpusArr[this.state.index - 2].text : ''  
    let postWord = typeof(this.state.corpusArr[this.state.index]) !== typeof(undefined) ? this.state.corpusArr[this.state.index].text : ''  

    let preNumSpaces   = typeof(prevWord) !== typeof(undefined) ? LARGEST_WORD_SIZE - prevWord.length : 0; 
    // let postNumSpaces  = typeof(postWord) !== typeof(undefined) ? LARGEST_WORD_SIZE - postWord.length : 0; 

    // add white spaces
    let preWsp  = Array(preNumSpaces).join("\u00a0");
    // let postWsp = Array(postNumSpaces).join("\u00a0");
    
    return (

      <div 
        className="Reader"
        onKeyUp={ this.handleKeyUp }
        >

        <br/>
        <br/>
        <br/>
        <br/>

        <div className="">
        
          

          {(this.state.enableSurroundingReels && this.state.displaySurroundingReels) ? 
            ( <span className="readerSurroundingWord">{preWsp}{prevWord}</span>) :
            ( <span>{Array(LARGEST_WORD_SIZE).join("\u00a0")}</span>)}
          
          
          {/* single space after pre-word */}
          <span className="readerSurroundingWord">{"\u00a0"}</span>

          <PlaybackHead
            currentReel = {this.state.currentReel}
          />
          
          {/* single space before post-word */}
          <span className="readerSurroundingWord">{"\u00a0"}</span>

          {(this.state.enableSurroundingReels && this.state.displaySurroundingReels) ? 
            (<span className="readerSurroundingWord">{postWord}</span>) : 
            (<span></span>)}

          <br/>
          <br/>

          <button onClick={this.play}>Play</button>
          &nbsp;
          <button onClick={this.pause}>Pause</button>
          &nbsp;
          <button onClick={this.reset}>Reset</button>
          


        </div>
        
        <br/>
        <br/>

        <div className="editor" style={styles.editor} onClick={this.focusEditor}>
        
          <Editor
            ref={this.setEditor}
            editorState={this.state.editorState}
            onChange={this.onChange}
            
            placeholder="Place your text content in here!"

            enableLineBreak={true}
            spellcheck={false}
            showUndoControl={true}
            showRedoControl={true}
            stripPastedStyles={true}
            readOnly={this.state.readOnly}
          />
        </div>
        
        <br/>

        {/* Modal Tag to wrap our settings page */}
        <ModalWrapper
          className="sample"
        />

      </div>
    );
  }
}

export default Reader;
