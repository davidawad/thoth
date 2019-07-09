import React, {Component} from 'react';

import './App.css';

import Reader from './components/Reader/Reader';
import ModalWrapper from './components/ModalWrapper/ModalWrapper';

import * as CONSTANTS from './components/constants';

const initialContent = CONSTANTS.INTRO_TEXT;

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)

let START_COLOR = CONSTANTS.START_COLOR;
let STOP_COLOR = CONSTANTS.STOP_COLOR;



class App extends Component {

  constructor(props) {

    super(props);
    this.state = { 
      year: new Date().getFullYear(), 
      initialContent : initialContent,
      readingSpeed: READING_SPEED,
      baseColorStop: START_COLOR,
      finalColorStop : STOP_COLOR,
    };

    // TODO remove this from here
    this.updateSettings = this.updateSettings.bind(this)
  }


  /* 
    Callback function that takes a settings object from child and updates duplicate keys in object state
  */ 
  updateSettings(newSettings) {
    this.setState(newSettings)
  }

  render() {

    /* 
      TODO take the query parameters from the URL and pass as initial text to the Reader Class using react router?
      https://stackoverflow.com/questions/29852998/getting-query-parameters-from-react-router-hash-fragment
    */
    
    return (
    
        <div className="App">

          <Reader 
            className="Reader"
            // {...this.settings}
            // initialContent={this.state.initialContent}
            // readingSpeed={this.state.readingSpeed}
            {...this.state}

            />

          <br/>

          {/* Modal Tag to wrap our settings page */}
          <ModalWrapper
            updateCallback={this.updateSettings}
            {...this.state}
          />

          

        <footer>

          

          {/* TODO link to research paper when it's written. */}
          <p>
            Thoth is an <a href="https://github.com/davidawad/thoth">open source</a> research project by <a href="http://davidawad.com">David Awad</a>. 
            <br/> &copy; {this.state.year}
          </p>
          
      </footer>

    </div>


    );

  }

}

export default App;
