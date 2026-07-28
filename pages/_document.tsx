import { Html, Head, Main, NextScript } from "next/document";

import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  THEMES,
} from "../src/components/constants";

// Applies the persisted (or OS-preferred) theme to <html data-theme="..."> as
// early as possible - before hydration/first paint - so there is no flash of
// the wrong theme. Kept intentionally tiny & defensive (try/catch) since it
// runs before React and before any of our own error handling exists.
const validThemeIds = JSON.stringify(THEMES.map((theme) => theme.id));

const THEME_INIT_SCRIPT = `(function () {
  try {
    var validThemes = ${validThemeIds};
    var stored = window.localStorage.getItem(${JSON.stringify(
      THEME_STORAGE_KEY
    )});
    var theme = validThemes.indexOf(stored) !== -1 ? stored : null;

    if (!theme) {
      var prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      theme = prefersDark ? "dark" : ${JSON.stringify(DEFAULT_THEME)};
    }

    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute(
      "data-theme",
      ${JSON.stringify(DEFAULT_THEME)}
    );
  }
})();`;

export default function Document() {
  return (
    <Html lang="en" data-theme={DEFAULT_THEME}>
      <Head>
        {/* Atkinson Hyperlegible: free accessibility-focused typeface from
            the Braille Institute of America - see SettingsPanel for the
            full attribution + legibility research citations. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />

        {/* Runs before paint to set the persisted theme; see comment above. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </Head>
      <body className="bg-base-100 text-base-content min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
