import React, { Component } from 'react';

import * as CONSTANTS from '../constants';

const MAX_DISPLAY_SIZE = CONSTANTS.MAX_DISPLAY_SIZE;
const UNICODE_WHITESPACE = CONSTANTS.UNICODE_WHITESPACE;

interface ReelLike {
  text: string;
  hotCharInd: number;
}

interface PlaybackHeadProps {
  currentReel: ReelLike;
  someProp?: unknown;
}

interface PlaybackHeadState {
  value: string;
  someProp?: unknown;
}

class PlaybackHead extends Component<PlaybackHeadProps, PlaybackHeadState> {
  constructor(props: PlaybackHeadProps) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      value: 'start state',
    };
  }

  handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ value: e.target.value });
  }

  // Update state when props change
  componentDidUpdate(prevProps: PlaybackHeadProps): void {
    if (prevProps.someProp !== this.props.someProp) {
      this.setState({ ...this.state, someProp: this.props.someProp });
    }
  }

  render() {
    const reel = this.props.currentReel;

    // if no hot point, just display text
    if (reel.hotCharInd < 0) {
      return <div className="Reader-canvas">{reel.text}</div>;
    }

    // otherwise find & display the Focus Point.
    const numSpaces = MAX_DISPLAY_SIZE - reel.hotCharInd;

    // add whitespaces
    const wsp = Array(numSpaces).join(UNICODE_WHITESPACE);
    const pre = reel.text.slice(0, reel.hotCharInd);
    const hot = reel.text[reel.hotCharInd];
    const post = reel.text.slice(reel.hotCharInd + 1);

    return (
      <div className="Reader-canvas">
        {wsp}

        {pre}

        <span className="red">{hot}</span>

        {post}
      </div>
    );
  }
}

export default PlaybackHead;
