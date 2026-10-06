import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from 'next/document';
import { ServerStyleSheet } from 'styled-components';

import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  THEMES,
} from '../src/components/constants';
import { PALETTE_STORAGE_KEY } from '../src/components/palette/applyPalette';
import { resolvePaletteCssVars } from '../src/components/palette/palettes';
import { paletteSchema } from '../src/components/palette/types';
import {
  HEAD_FONTS,
  HEAD_FONT_ATTRIBUTE,
  HEAD_FONT_STORAGE_KEY,
} from '../src/components/Reader/headFont';

// Applies the persisted (or OS-preferred) theme to <html data-theme="..."> as
// early as possible - before hydration/first paint - so there is no flash of
// the wrong theme. Kept intentionally tiny & defensive (try/catch) since it
// runs before React and before any of our own error handling exists.
const validThemeIds = JSON.stringify(THEMES.map((theme) => theme.id));

const THEME_INIT_SCRIPT = `(function () {
  try {
    var validThemes = ${validThemeIds};
    var stored = window.localStorage.getItem(${JSON.stringify(
      THEME_STORAGE_KEY,
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

// Pre-paint palette: the inline CSS variables for every palette x mode,
// precomputed at build time, so a saved palette applies before first paint
// (no flash of the default colors). The custom accent needs a contrast check,
// so it is applied after hydration instead (see applyStoredPalette).
const paletteVars = JSON.stringify(
  Object.fromEntries(
    paletteSchema.options.map((palette) => [
      palette,
      {
        dark: resolvePaletteCssVars(palette, 'dark', null),
        light: resolvePaletteCssVars(palette, 'light', null),
      },
    ]),
  ),
);

const PALETTE_INIT_SCRIPT = `(function () {
  try {
    var key = window.localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});
    var all = ${paletteVars};
    var root = document.documentElement;
    var mode = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var vars = all[key] && all[key][mode];
    if (!vars) return;
    for (var name in vars) root.style.setProperty(name, vars[name]);
    root.setAttribute("data-palette", key);
  } catch (e) {}
})();`;

// Pre-paint playback-head font (no flash of the default before a saved choice).
const HEAD_FONT_INIT_SCRIPT = `(function () {
  try {
    var ids = ${JSON.stringify(HEAD_FONTS.map((font) => font.id))};
    var saved = window.localStorage.getItem(${JSON.stringify(HEAD_FONT_STORAGE_KEY)});
    if (ids.indexOf(saved) !== -1) {
      document.documentElement.setAttribute(${JSON.stringify(HEAD_FONT_ATTRIBUTE)}, saved);
    }
  } catch (e) {}
})();`;

export default class AppDocument extends Document {
  // Collect styled-components styles during SSR so the server-rendered class
  // names match the client (otherwise: hydration mismatch on FileParser).
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="en" data-theme={DEFAULT_THEME}>
        <Head>
          {/* Fonts are self-hosted via @fontsource (see pages/_app.tsx) - no
            third-party font requests. Atkinson Hyperlegible: free
            accessibility-focused typeface from the Braille Institute of
            America; see SettingsPanel for the attribution + legibility
            research citations. */}

          {/* Runs before paint to set the persisted theme; see comment above. */}
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: PALETTE_INIT_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: HEAD_FONT_INIT_SCRIPT }} />
        </Head>
        <body className="bg-base-100 text-base-content min-h-screen">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
