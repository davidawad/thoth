import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Player from "./Player";

describe("Player component", () => {
  test("renders with initial paused state", () => {
    render(<Player />);
    expect(screen.getByTestId("status")).toHaveTextContent("Paused");
  });

  test("clicking play button sets status to Playing", () => {
    render(<Player />);
    const playButton = screen.getByTestId("play-button");
    fireEvent.click(playButton);
    expect(screen.getByTestId("status")).toHaveTextContent("Playing");
  });

  test("clicking pause button sets status back to Paused", () => {
    render(<Player />);
    const playButton = screen.getByTestId("play-button");
    fireEvent.click(playButton);
    expect(screen.getByTestId("status")).toHaveTextContent("Playing");
    const pauseButton = screen.getByTestId("pause-button");
    fireEvent.click(pauseButton);
    expect(screen.getByTestId("status")).toHaveTextContent("Paused");
  });
});
