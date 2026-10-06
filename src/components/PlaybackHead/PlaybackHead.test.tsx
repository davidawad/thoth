import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PlaybackHead from './PlaybackHead';

const q = (c: HTMLElement, sel: string) => c.querySelector(sel);

describe('PlaybackHead', () => {
  it('shows the whole text, unsplit, when there is no focus letter', () => {
    const { container } = render(
      <PlaybackHead currentReel={{ text: 'Hello, world!', hotCharInd: -1 }} />,
    );
    expect(q(container, '.playbackHeadWhole')?.textContent).toBe(
      'Hello, world!',
    );
    expect(q(container, '.playbackHeadHot')).toBeNull();
  });

  it('splits the word around the focus letter, which gets its own element', () => {
    const { container } = render(
      <PlaybackHead currentReel={{ text: 'abcdef', hotCharInd: 2 }} />,
    );
    expect(q(container, '.playbackHeadPre')?.textContent).toBe('ab');
    expect(q(container, '.playbackHeadHot')?.textContent).toBe('c');
    expect(q(container, '.playbackHeadPost')?.textContent).toBe('def');
    expect(q(container, '.Reader-canvas')?.textContent).toBe('abcdef');
  });

  it('treats an out-of-range focus index as no focus letter', () => {
    const { container } = render(
      <PlaybackHead currentReel={{ text: 'ab', hotCharInd: 5 }} />,
    );
    expect(q(container, '.playbackHeadHot')).toBeNull();
    expect(q(container, '.playbackHeadWhole')?.textContent).toBe('ab');
  });

  it('shows the words before and after, hidden from screen readers', () => {
    const { container } = render(
      <PlaybackHead
        currentReel={{ text: 'middle', hotCharInd: 1 }}
        before="first"
        after="last"
      />,
    );
    const before = q(container, '.playbackHeadSide--before');
    const after = q(container, '.playbackHeadSide--after');
    expect(before?.textContent).toBe('first');
    expect(after?.textContent).toBe('last');
    expect(before?.getAttribute('aria-hidden')).toBe('true');
    expect(after?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves the sides empty when there are no neighbours', () => {
    const { container } = render(
      <PlaybackHead currentReel={{ text: 'solo', hotCharInd: 1 }} />,
    );
    expect(q(container, '.playbackHeadSide--before')?.textContent).toBe('');
    expect(q(container, '.playbackHeadSide--after')?.textContent).toBe('');
  });
});
