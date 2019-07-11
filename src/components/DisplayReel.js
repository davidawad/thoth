/* 
A phrase Reel is intended to be modeled after a single reel of film in a VHS Tape. 

The single reel contains all display information for that particular frame. 

Such as the time, the string content itself to be displayed, and if a letter is going to be highlighted.
*/

class DisplayReel {
  constructor(text, hotCharInd, displayTime) {
    this.text = text;
    this.hotCharInd = parseInt(hotCharInd);
    this.displayTime = displayTime;
  }
}

export default DisplayReel;
