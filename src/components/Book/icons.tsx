import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.1em"
      height="1.1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconPrev = () => (
  <Icon>
    <path d="M6 5v14M19 5l-9 7 9 7z" />
  </Icon>
);
export const IconNext = () => (
  <Icon>
    <path d="M18 5v14M5 5l9 7-9 7z" />
  </Icon>
);
export const IconPlay = () => (
  <Icon>
    <path d="M7 4l13 8-13 8z" fill="currentColor" />
  </Icon>
);
export const IconPause = () => (
  <Icon>
    <path d="M8 4v16M16 4v16" strokeWidth="3.5" />
  </Icon>
);
export const IconPagePrev = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);
export const IconPageNext = () => (
  <Icon>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
export const IconContents = () => (
  <Icon>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Icon>
);
export const IconSliders = () => (
  <Icon>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
);
