import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import LandingIntro, { PAPER_TITLE, PAPER_URL } from './LandingIntro';

describe('LandingIntro', () => {
  it('explains how to use Thoth', () => {
    const { container } = render(<LandingIntro />);
    const text = container.textContent ?? '';
    for (const part of [
      'RSVP',
      'PDF or EPUB',
      'sample',
      'speed slider',
      'Space',
      'heat map',
    ]) {
      expect(text).toContain(part);
    }
  });

  it('keeps the Zethos / Spritz credit and the paper link', () => {
    const { container } = render(<LandingIntro />);
    expect(container.textContent).toContain('Zethos and Spritz');
    const link = within(container).getByRole('link', {
      name: new RegExp(PAPER_TITLE),
    });
    expect(link.getAttribute('href')).toBe(PAPER_URL);
    expect(PAPER_URL).toBe('https://arxiv.org/abs/1908.01699');
  });
});
