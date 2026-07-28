// NOTE: daisyui v5 is configured via CSS (`@plugin "daisyui"` /
// `@plugin "daisyui/theme"` in styles/globals.css), not here - daisyui v4's
// JS-plugin API (`plugins: [require("daisyui")]`) is not compatible with
// Tailwind CSS v4's engine. This file only supplies the legacy `content`
// globs + a couple of `theme.extend` tokens, loaded into the v4 CSS-first
// config via `@config "../tailwind.config.js";` in globals.css.
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Sitewide typeface (see pages/_document.js for the Google Fonts <link>).
        // Falls back to the system UI stack if the font fails to load.
        sans: [
          "Atkinson Hyperlegible",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        // Reading-measure tokens: ~55-75 characters per line (W3C / Section 508
        // guidance) for blocks of body copy. Not applied to the single-word
        // RSVP display, which is a different kind of UI element.
        measure: "70ch",
        "measure-narrow": "55ch",
      },
      spacing: {
        // Small pragmatic spacing scale on top of Tailwind's default one,
        // named for the design-token roles used across the settings UI.
        18: "4.5rem",
      },
    },
  },
};
