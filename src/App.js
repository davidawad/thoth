import React, {Component} from 'react';

import './App.css';

import Reader from './components/Reader/Reader';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { year: new Date().getFullYear() };
  }

  render() {
    
    return (
    
        <div className="App">

          <Reader className="Reader"/>

          <footer>
            <ul className="site-links">
              <li>
                Thoth &copy; {this.state.year} <a href="davidawad.com">David Awad</a>.
              </li>
            </ul>        
          </footer>

        </div>

    );

  }

}

export default App;
