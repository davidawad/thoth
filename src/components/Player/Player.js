import React, { useState } from "react";

const Player = () => {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  return (
    <div>
      <div data-testid="status">{playing ? "Playing" : "Paused"}</div>
      <button onClick={handlePlay} data-testid="play-button">
        Play
      </button>
      <button onClick={handlePause} data-testid="pause-button">
        Pause
      </button>
    </div>
  );
};

export default Player;
