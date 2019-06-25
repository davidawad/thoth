import React, {Component} from 'react';

import './App.css';

import Reader from './components/Reader/Reader';

import * as CONSTANTS from './components/constants';


const initialContent = CONSTANTS.INTRO_TEXT;


class App extends Component {

  constructor(props) {
    super(props);
    this.state = { 
      year: new Date().getFullYear(), 
      startingText : initialContent,
    };
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

            initialContent={this.state.startingText}
            />

          <footer>
            <ul className="site-links">
              <li>
              {/* TODO link to research paper when it's written. */}
              Thoth is an <a href="https://github.com/davidawad/thoth">open source</a> research project by <a href="http://davidawad.com">David Awad</a>. &copy; {this.state.year}
              </li>
            </ul>        
          </footer>

        </div>

    );

  }

}

export default App;
