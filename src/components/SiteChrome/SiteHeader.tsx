// Thoth's logomark: a ring (the same circle motif as the center of Seshat's
// star) holding three lines of text - reading, as opposed to Seshat's rays.
// Same rounded, even-weight strokes so the two marks read as a pair.
function ThothMark() {
  return (
    <svg
      className="app-brand-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="24"
        cy="24"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <g fill="currentColor">
        <rect x="14" y="15" width="20" height="3" rx="1.5" />
        <rect x="14" y="22.5" width="20" height="3" rx="1.5" />
        <rect x="14" y="30" width="12" height="3" rx="1.5" />
      </g>
    </svg>
  );
}

/**
 * The app-wide header: just the brand, laid out like Seshat's. The sibling
 * app is linked from the footer, not here.
 */
export default function SiteHeader() {
  return (
    <header className="app-header">
      <a href="." className="app-brand">
        <ThothMark />
        Thoth
      </a>
    </header>
  );
}
