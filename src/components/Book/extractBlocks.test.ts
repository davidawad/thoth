import { describe, expect, it } from 'vitest';
import { extractBlocks } from './extractBlocks';

const html = (body: string, head = ''): string =>
  `<html><head>${head}</head><body>${body}</body></html>`;

describe('extractBlocks', () => {
  it('keeps paragraph breaks and ignores <head><title>', () => {
    const r = extractBlocks(
      html(
        '<h2>Chapter One</h2><p>First  para\n here.</p><p>Second.</p>',
        '<title>Cover</title>',
      ),
    );
    expect(r.heading).toBe('Chapter One');
    expect(r.text).toBe('Chapter One\n\nFirst para here.\n\nSecond.');
  });
  it('drops scripts/styles and handles br', () => {
    const r = extractBlocks(
      html('<style>p{}</style><p>a<br>b</p><script>x()</script>'),
    );
    expect(r.text).toBe('a\n\nb');
  });
  it('is safe on empty / null / body-less input', () => {
    expect(extractBlocks(null)).toEqual({ text: '', heading: '' });
    expect(extractBlocks('')).toEqual({ text: '', heading: '' });
    expect(extractBlocks('plain text only').text).toBe('plain text only');
  });
});
