import { describe, it, expect } from 'vitest';
import {
  createDeterministicContentState,
  READER_EDITOR_KEY,
} from './deterministicContent';

describe('createDeterministicContentState', () => {
  it('produces identical block keys across calls (hydration parity)', () => {
    const text = 'Hello!\nsecond line\n\nfourth';
    const keysA = createDeterministicContentState(text)
      .getBlocksAsArray()
      .map((b) => b.getKey());
    const keysB = createDeterministicContentState(text)
      .getBlocksAsArray()
      .map((b) => b.getKey());

    expect(keysA).toEqual(keysB);
    expect(keysA).toEqual(['block-0', 'block-1', 'block-2', 'block-3']);
  });

  it('preserves the text like ContentState.createFromText', () => {
    expect(
      createDeterministicContentState('one\r\ntwo\nthree').getPlainText(),
    ).toBe('one\ntwo\nthree');
  });

  it('handles empty text with a single block', () => {
    const state = createDeterministicContentState('');
    expect(state.getBlocksAsArray()).toHaveLength(1);
    expect(state.getFirstBlock().getKey()).toBe('block-0');
  });

  it('exposes a constant editor key', () => {
    expect(READER_EDITOR_KEY).toBe('reader-editor');
  });
});
