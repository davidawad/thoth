module.exports = {
  presets: [
    // Any custom babel.config.js makes Next.js defer 100% to it (that's why
    // SWC gets disabled) instead of layering on next/babel's own presets -
    // include next/babel explicitly so its webpack pipeline still knows how
    // to strip TypeScript syntax (@babel/preset-typescript alone parses fine
    // for Jest, but Next's babel-loader wasn't applying it without this).
    'next/babel',
    '@babel/preset-typescript',
  ],
  // Gives each styled component a stable, file-based componentId (and
  // displayName). Without it styled-components uses a global creation counter,
  // so SSR and client class names can diverge -> React hydration mismatch.
  plugins: [
    ['babel-plugin-styled-components', { ssr: true, displayName: true }],
  ],
};
