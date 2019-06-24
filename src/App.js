import React, {Component} from 'react';

import './App.css';

import Reader from './components/Reader/Reader';


const initialContent = `Hello! 

This is Thoth, an open source speed reading tool inspired by Zethos and Spritz ($3.5mil series A).

It combines a few different features of other powerful speed readers and lets you set options yourself.

It's free and open source on GitHub.  

Seek truth, but faster. Enjoy!

- David`


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
      TODO take the query parameters from the URL and pass as initial text to the Reader Class. 
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
