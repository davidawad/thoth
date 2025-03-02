import React from "react";
import { render, screen } from "@testing-library/react";
import PlaybackHead from "./PlaybackHead";

// Mock the constants so that MAX_DISPLAY_SIZE is predictable.
jest.mock("../constants", () => ({
  MAX_DISPLAY_SIZE: 10,
}));

describe("PlaybackHead Component", () => {
  it("renders the reel text without formatting when hotCharInd is less than 0", () => {
    const dummyReel = {
      text: "Hello, world!",
      hotCharInd: -1,
    };

    render(<PlaybackHead currentReel={dummyReel} />);
    // Expect that the entire text is rendered in a div with the class "Reader-canvas"
    const canvasDiv = screen.getByText("Hello, world!");
    expect(canvasDiv).toBeInTheDocument();
    expect(canvasDiv).toHaveClass("Reader-canvas");
  });

  it("renders the reel text with hot letter highlighted when hotCharInd is 0 or greater", () => {
    // For example, for reel.text = "abcdef" and hotCharInd = 2,
    // we expect "ab" to be before the highlighted letter, then "c" wrapped in a span.red,
    // and then "def" after.
    const reel = {
      text: "abcdef",
      hotCharInd: 2,
    };

    // With our mocked constant, MAX_DISPLAY_SIZE = 10
    // Calculate expected white spaces:
    //   numSpaces = MAX_DISPLAY_SIZE - hotCharInd = 10 - 2 = 8
    // BUT note that Array(8).join('\u00a0') produces a string with (8 - 1) non-breaking spaces.
    const numSpaces = 10 - reel.hotCharInd; // equals 8
    const expectedWsp = Array(numSpaces).join("\u00a0"); // yields 7 non-breaking spaces
    const expectedPre = reel.text.slice(0, reel.hotCharInd); // "ab"
    const expectedHot = reel.text[reel.hotCharInd]; // "c"
    const expectedPost = reel.text.slice(reel.hotCharInd + 1); // "def"

    const { container } = render(<PlaybackHead currentReel={reel} />);
    const canvasDiv = container.querySelector(".Reader-canvas");
    expect(canvasDiv).toBeInTheDocument();

    // The textContent should be equal to the white spaces followed by the pre, hot, and post parts.
    const expectedTextContent =
      expectedWsp + expectedPre + expectedHot + expectedPost;
    expect(canvasDiv.textContent).toBe(expectedTextContent);

    // Also, check that the hot letter is wrapped in a span with the 'red' class.
    const redSpan = container.querySelector("span.red");
    expect(redSpan).toBeInTheDocument();
    expect(redSpan.textContent).toBe(expectedHot);
  });

  it("responds to new props via componentWillReceiveProps without breaking rendering", () => {
    const initialReel = {
      text: "initial text",
      hotCharInd: -1,
    };

    const { container, rerender } = render(
      <PlaybackHead currentReel={initialReel} someProp="foo" />
    );

    // Check initial render
    let canvasDiv = container.querySelector(".Reader-canvas");
    expect(canvasDiv).toBeInTheDocument();
    expect(canvasDiv.textContent).toBe(initialReel.text);

    // Update the props to trigger componentWillReceiveProps.
    // (Note: the component sets state.someProp from the new props, but since that state isn't rendered,
    // we verify that the visible text changes when we update currentReel.)
    const updatedReel = {
      text: "updated text",
      hotCharInd: -1,
    };
    rerender(<PlaybackHead currentReel={updatedReel} someProp="bar" />);
    canvasDiv = container.querySelector(".Reader-canvas");
    expect(canvasDiv.textContent).toBe(updatedReel.text);
  });
});
