import React, { Component } from 'react';

import {Editor, EditorState, ContentState} from 'draft-js';

import './Reader.css';
// import '../Editor/Editor.css';
import PlaybackHead from '../PlaybackHead/PlaybackHead';
import DisplayReel from '../DisplayReel';

import * as CONSTANTS from '../constants';

const SPACE_KEY = 32

const initialContent = `Hello! 

This is Thoth, an open source speed reading tool inspired by Zethos and Spritz ($3.5mil series A).

It's free and open source on GitHub.  

Seek truth, but faster. Enjoy!

- David`


const styles = {
  editor: {
    border: '1px solid gray',
    minHeight: '20em',
    padding: '20px'
  }
};


let READING_SPEED = 700 // in words-per-minute (wpm)
let MAX_WORD_SIZE = CONSTANTS.MAX_WORD_SIZE;




class Reader extends Component {  

  constructor(props) {
    super(props);

    // to bind paste handler to correct context for setState
    this.pasteHandler = this.pasteHandler.bind(this);

    this.play  = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.reset = this.reset.bind(this);
    this.parse = this.parse.bind(this);
    this.hyphenate = this.hyphenate.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    
    
    this.onChange = (editorState) => this.setState({editorState});

    this.setEditor = (editor) => {
      this.editor = editor;
    };

    this.state = {
      index: 0,
      paused: true,
      bodyText: initialContent,
      editorState: EditorState.createWithContent(ContentState.createFromText(initialContent)),
      currentReel: new DisplayReel('Press "Play".', -1, 1000),
      corpusArr: this.parse(initialContent),
    };
  }



  hyphenate(word) {

    let ret = word
    let len = word.length

    // console.log(word, len)

    // TODO idfk why I can't tear this disgusting thing apart without it breaking
    ret = len < MAX_WORD_SIZE ? word : len < 11 ? word.slice(0, len - 3) + '- ' + word.slice(len - 3) : word.slice(0,7) + '- ' + this.hyphenate(word.slice(7))

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
      })

      return;
    }

    //console.log(this.state.paused)

    // STATE updates are bundled together!! 
    if (this.state.paused) { 
      console.log("READING PAUSED.") 
      return 
    }

    // word object
    const newReel = arr[this.state.index]

    this.setState({
      currentReel: newReel,
      index: (this.state.index + 1),
    })

    // make recursive call    
    let next_callback = function(){ 
      this.loop() 
    }.bind(this); // make sure we can refer to parent context.
    

    setTimeout(next_callback, newReel.displayTime)
  }

  play () {

    // if paused, unpause and continue playing
    if (this.state.paused) {
      
      console.log("paused, starting reading")

      this.setState({
        paused: false,
      }, () => {this.loop()})

      return;
    }

    // play from beginning to end. 
    this.loop()
  }

  pause () {
    this.setState({paused: true})
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

      console.log('Space Bar Pressed')

      // toggle play_pause
      this.playpause()
    }
  }

  reset() {
    this.setState({index: 0})
  }


  // TODO not necessary anymore?
  pasteHandler(event){
    let text = '';
    let arr = [];

    // get plain text from the paste event
    text = this.state.editorState.getCurrentContent().getPlainText();

    arr = this.parse(text);

    console.log("user pasted :", text)

    this.setState({
      "bodyText": text,
      "corpusArr" : arr,
    })
  }


  render() {

    return (

      <div 
        className="Reader"
        onKeyUp={ this.handleKeyUp }
        >

        <br/>
        <br/>
          
        <button onClick={this.play}>Play</button>
        &nbsp;
        <button onClick={this.pause}>Pause</button>
        &nbsp;
        <button onClick={this.reset}>Reset</button>
        
        <br/>
        <br/>

        <PlaybackHead
          currentReel = {this.state.currentReel}
        />
        
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
          />
        </div>
        
      </div>
    );
  }
}

export default Reader;
