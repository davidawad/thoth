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
};
