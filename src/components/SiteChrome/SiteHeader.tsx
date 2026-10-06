// Thoth's logomark, built from the same pieces as Seshat's seven-pointed star
// (a center disc and 3-wide rounded rays) but arranged differently: four short
// rays inside a ring, like a reticle - the focus point of RSVP reading.
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
        <rect x="22.5" y="8" width="3" height="8" rx="1.5" />
        <rect
          x="22.5"
          y="8"
          width="3"
          height="8"
          rx="1.5"
          transform="rotate(90 24 24)"
        />
        <rect
          x="22.5"
          y="8"
          width="3"
          height="8"
          rx="1.5"
          transform="rotate(180 24 24)"
        />
        <rect
          x="22.5"
          y="8"
          width="3"
          height="8"
          rx="1.5"
          transform="rotate(270 24 24)"
        />
        <circle cx="24" cy="24" r="4.5" />
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
