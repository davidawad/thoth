import { ContentState, type ContentBlock } from 'draft-js';

/**
 * Stable editor key for the Reader's draft-js <Editor>. draft-js otherwise
 * generates a random one (Math.random) per mount, which makes the
 * server-rendered `data-editor` attribute differ from the client's and
 * triggers a React hydration mismatch.
 */
export const READER_EDITOR_KEY = 'reader-editor';

/**
 * Like `ContentState.createFromText`, but block keys are derived from the
 * block index instead of Math.random, so server and client render identical
 * `data-offset-key` attributes (no hydration mismatch).
 */
export function createDeterministicContentState(text: string): ContentState {
  const blocks = ContentState.createFromText(text)
    .getBlocksAsArray()
    .map(
      (block, index) =>
        block.set('key', `block-${index}`) as unknown as ContentBlock,
    );

  return ContentState.createFromBlockArray(blocks);
}
