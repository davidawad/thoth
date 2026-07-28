/*
A phrase Reel is intended to be modeled after a single reel of film in a VHS Tape.

The single reel contains all display information for that particular frame.

Such as the time, the string content itself to be displayed, and if a letter is going to be highlighted.
*/

class DisplayReel {
  text: string;
  hotCharInd: number;
  displayTime: number;

  constructor(text: string, hotCharInd: number | string, displayTime: number) {
    this.text = text;
    this.hotCharInd = parseInt(String(hotCharInd), 10);
    this.displayTime = displayTime;
  }
}

export default DisplayReel;
