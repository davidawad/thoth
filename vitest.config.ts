import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
      thresholds: {
        // No blanket 100% threshold: the pure-logic modules below have
        // dedicated unit/property test suites and hold a real, high bar.
        // The React components (Reader.tsx, FileParser.tsx, EpubParser.tsx,
        // PDFParser.tsx, ModalWrapper.tsx, SettingsPanel.tsx) have none yet -
        // covered so far only via manual/browser verification during
        // development, not automated tests. That's a real, documented gap
        // (follow-up: React Testing Library component tests), not something
        // to paper over with a threshold the codebase doesn't clear.
        'src/components/utils.ts': {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
        // branches thresholds on these two are set with real margin below
        // the observed floor, not at it: both are covered mostly by
        // fast-check property tests with no fixed seed, so which branches
        // get hit varies run to run (measured 83.33%-91.66% for
        // TextParsingTools.ts branches across 5 consecutive local runs) -
        // a threshold set at the high end of that range would flake in CI
        // on a bad seed rather than reflect any real coverage change.
        'src/components/TextParsingTools.ts': {
          lines: 90,
          branches: 75,
          functions: 90,
          statements: 90,
        },
        'src/components/SpeedWritingTools.ts': {
          lines: 90,
          branches: 80,
          functions: 90,
          statements: 90,
        },
        'src/components/EpubParser/extractText.ts': {
          lines: 100,
          branches: 75,
          functions: 100,
          statements: 100,
        },
        'src/components/schemas.ts': {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  },
});
