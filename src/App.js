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
              Thoth is an <a href="https://github.com/davidawad/thoth">open source project</a> by <a href="http://davidawad.com">David Awad</a>. &copy; {this.state.year}
              </li>
            </ul>        
          </footer>

        </div>

    );

  }

}

export default App;
