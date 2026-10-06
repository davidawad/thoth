import { SESHAT_URL } from './links';

// Thoth's emblem - the crescent moon and disc of the lunar god - used as the
// header logomark, the counterpart to Seshat's seven-pointed star.
function ThothMark() {
  return (
    <svg
      className="app-brand-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <path d="M30 6a18 18 0 1 0 0 36 14 14 0 1 1 0-36z" />
        <circle cx="33" cy="24" r="5" />
      </g>
    </svg>
  );
}

/**
 * The app-wide header: brand on the left, and a two-entry switcher between
 * the sibling tools (Thoth for reading, Seshat for studying) on the right,
 * so they feel like one family of related education tools.
 */
export default function SiteHeader() {
  return (
    <header className="app-header">
      <a href="." className="app-brand">
        <ThothMark />
        Thoth
      </a>
      <nav aria-label="Primary">
        <ul className="app-nav">
          <li>
            <a href="." aria-current="page">
              Read
            </a>
          </li>
          <li>
            <a href={SESHAT_URL}>Study (Seshat)</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
