import React, { Component } from 'react';

import * as CONSTANTS from '../constants';
let MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;

class PlaybackHead extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      value: 'start state'
    };
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  // Update state when props change
  componentDidUpdate(prevProps) {
    if (prevProps.someProp !== this.props.someProp) {
      this.setState({ ...this.state, someProp: this.props.someProp });
    }
  }

  render() {
    const reel = this.props.currentReel;

    let ret = <div className="Reader-canvas">{reel.text}</div>;

    // if no hot point, just display text
    if (reel.hotCharInd < 0) {
      ret = <div className="Reader-canvas">{reel.text}</div>;
    } else {
      // otherwise find & display the Focus Point.

      let numSpaces = MAX_DISPLAY_SIZE - reel.hotCharInd;

      // console.log("NUM SPACES: ", MAX_DISPLAY_SIZE, reel.hotCharInd, typeof(reel.hotCharInd), numSpaces);

      // add whitespaces
      let wsp = Array(numSpaces).join('\u00a0');
      let pre = reel.text.slice(0, reel.hotCharInd);
      let hot = reel.text[reel.hotCharInd];
      let post = reel.text.slice(reel.hotCharInd + 1);

      // console.log(reel.text, typeof(reel.text), pre, hot, post)

      ret = (
        <div className="Reader-canvas">
          {wsp}

          {pre}

          <span className="red">
            {/* inject out hot letter */}
            {hot}
          </span>

          {post}
        </div>
      );
    }

    return ret;
  }
}

export default PlaybackHead;
