import { FOOTER_LINKS } from './links';

interface SiteFooterProps {
  onOpenSettings: () => void;
}

/**
 * The app-wide footer, laid out like Seshat's: copyright and version on the
 * left, reference links plus the Settings button as plain text links on the
 * right.
 */
export default function SiteFooter({ onOpenSettings }: SiteFooterProps) {
  return (
    <footer className="app-footer">
      <span className="app-footer-copyright">
        &copy; {new Date().getFullYear()} David Awad &mdash; free &amp; open
        source
        {' · '}
        <span data-testid="footer-version">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </span>
      </span>
      <nav aria-label="Footer" className="app-footer-actions">
        {FOOTER_LINKS.map((link) => (
          <a key={link.label} href={link.href} className="app-footer-link">
            {link.label}
          </a>
        ))}
        <button
          type="button"
          className="app-footer-settings"
          onClick={onOpenSettings}
        >
          Settings
        </button>
      </nav>
    </footer>
  );
}
