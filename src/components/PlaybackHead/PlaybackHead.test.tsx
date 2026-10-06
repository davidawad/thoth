import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PlaybackHead, { fitScale } from './PlaybackHead';

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

describe('fitScale', () => {
  it('leaves ordinary words at full size', () => {
    expect(fitScale('Remember', 2)).toBe(1);
    expect(fitScale('how', 1)).toBe(1);
    expect(fitScale('', null)).toBe(1);
  });

  it('shrinks a long word so the longer side of the focus letter fits', () => {
    const scale = fitScale('disproportionately', 5);

    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(0.5);
  });

  it('shrinks a long word that has no focus letter', () => {
    expect(fitScale('internationalization-of-everything', null)).toBe(0.5);
    expect(fitScale('abcdefghijklmnopqrst', null)).toBeLessThan(1);
  });

  it('never goes below the floor, however long the word', () => {
    expect(fitScale('x'.repeat(200), 100)).toBe(0.5);
  });

  it('is applied to the rendered word as a font size', () => {
    const { container } = render(
      <PlaybackHead
        currentReel={{ text: 'disproportionately', hotCharInd: 5 }}
      />,
    );
    const canvas = container.querySelector('.Reader-canvas') as HTMLElement;

    expect(canvas.style.fontSize).toMatch(/em$/);
    expect(parseFloat(canvas.style.fontSize)).toBeLessThan(1);
  });

  it('adds no inline size to a short word', () => {
    const { container } = render(
      <PlaybackHead currentReel={{ text: 'how', hotCharInd: 1 }} />,
    );
    const canvas = container.querySelector('.Reader-canvas') as HTMLElement;

    expect(canvas.style.fontSize).toBe('');
  });
});
