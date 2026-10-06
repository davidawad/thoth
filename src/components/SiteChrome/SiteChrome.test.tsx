import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { FOOTER_LINKS, SESHAT_URL } from './links';

afterEach(cleanup);

describe('SiteHeader', () => {
  it('shows the brand and a switcher to the sibling Seshat app', () => {
    render(<SiteHeader />);

    expect(screen.getByText('Thoth')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Read' }).getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen.getByRole('link', { name: /Seshat/ }).getAttribute('href'),
    ).toBe(SESHAT_URL);
  });
});

describe('SiteFooter', () => {
  it('lists every reference link and the copyright line', () => {
    render(<SiteFooter onOpenSettings={() => {}} />);

    for (const link of FOOTER_LINKS) {
      expect(
        screen.getByRole('link', { name: link.label }).getAttribute('href'),
      ).toBe(link.href);
    }
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear()))),
    ).toBeTruthy();
  });

  it('opens settings from the footer button', () => {
    const onOpenSettings = vi.fn();
    render(<SiteFooter onOpenSettings={onOpenSettings} />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
