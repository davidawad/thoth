/*
  Typing / pasting into the landing editor with the difficulty heat map ON.
  The editor state a keystroke produces must be applied as-is (caret kept, no
  duplicated text), and the edited text is committed - tape, stats, decorator
  scores - once typing pauses or Play is pressed.
*/
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { EditorState, Modifier, SelectionState } from 'draft-js';
import Reader from './Reader';

const START = 'The cat sat. The dog ran.';

function setup(props: Record<string, unknown> = {}) {
  const ref = createRef<Reader>();
  const utils = render(
    <Reader
      ref={ref}
      content={START}
      readingSpeed={300}
      difficultyHighlightEnabled
      {...props}
    />,
  );
  return { ref, ...utils };
}

/** What draft-js hands onChange after a keystroke: new content, caret after it. */
function typeAtEnd(state: EditorState, chars: string): EditorState {
  const content = state.getCurrentContent();
  const last = content.getLastBlock();
  const at = SelectionState.createEmpty(last.getKey()).merge({
    anchorOffset: last.getLength(),
    focusOffset: last.getLength(),
  }) as SelectionState;
  const next = Modifier.insertText(content, at, chars);
  return EditorState.forceSelection(
    EditorState.push(state, next, 'insert-characters'),
    next.getSelectionAfter(),
  );
}

const editorText = (r: Reader): string =>
  r.state.editorState.getCurrentContent().getPlainText();

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Reader editing with the heat-map decorator on', () => {
  it('keeps what was typed exactly once, with the caret after it', () => {
    const { ref } = setup();
    const reader = ref.current as Reader;
    let state = reader.state.editorState;
    for (const ch of ' Bold') {
      state = typeAtEnd(state, ch);
      act(() => reader.onEditorChange(state));
    }
    expect(editorText(reader)).toBe(`${START} Bold`);
    const sel = reader.state.editorState.getSelection();
    expect(sel.getFocusOffset()).toBe(`${START} Bold`.length);
    expect(
      reader.state.editorState.getCurrentContent().getBlocksAsArray(),
    ).toHaveLength(1);
  });

  it('re-parses the playback tape and re-scores after typing pauses', () => {
    const { ref } = setup();
    const reader = ref.current as Reader;
    const before = reader.state.tape.length;
    act(() =>
      reader.onEditorChange(
        typeAtEnd(reader.state.editorState, ' Extra words'),
      ),
    );
    // not committed yet: the tape still reflects the old text
    expect(reader.state.tape).toHaveLength(before);
    const decoratorBefore = reader.state.editorState.getDecorator();
    act(() => vi.advanceTimersByTime(400));
    expect(reader.state.tape).toHaveLength(before + 2);
    expect(reader.state.bodyText).toBe(`${START} Extra words`);
    expect(reader.state.editorState.getDecorator()).not.toBe(decoratorBefore);
    expect(editorText(reader)).toBe(`${START} Extra words`);
  });

  it('plays the latest text when Play is pressed before the pause elapses', () => {
    const { ref } = setup();
    const reader = ref.current as Reader;
    act(() =>
      reader.onEditorChange(typeAtEnd(reader.state.editorState, ' Fresh')),
    );
    act(() => reader.play());
    expect(reader.state.bodyText).toBe(`${START} Fresh`);
    expect(reader.state.tape.map((r) => r.text)).toContain('Fresh');
    act(() => reader.pause());
  });

  it('a selection-only change does not re-parse or touch the text', () => {
    const { ref } = setup();
    const reader = ref.current as Reader;
    const tape = reader.state.tape;
    const moved = EditorState.moveSelectionToEnd(reader.state.editorState);
    act(() => reader.onEditorChange(moved));
    act(() => vi.advanceTimersByTime(1000));
    expect(reader.state.tape).toBe(tape);
    expect(editorText(reader)).toBe(START);
  });

  it('works the same with the heat map off', () => {
    const { ref } = setup({ difficultyHighlightEnabled: false });
    const reader = ref.current as Reader;
    act(() =>
      reader.onEditorChange(typeAtEnd(reader.state.editorState, ' ok')),
    );
    act(() => vi.advanceTimersByTime(400));
    expect(reader.state.bodyText).toBe(`${START} ok`);
    expect(editorText(reader)).toBe(`${START} ok`);
  });
});
