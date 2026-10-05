# Bombadil spec for Thoth

Property-based UI testing with [Bombadil](https://antithesishq.github.io/bombadil/) (v0.7.8).
The spec (`specification.ts`) re-exports Bombadil's defaults (no uncaught
exceptions / unhandled rejections / console errors / HTTP 4xx-5xx) and adds:
`<main>` always rendered, page never blank, never leaves localhost.

## Run

    pnpm dev -p 3000          # in the repo root, one terminal
    cd bombadil && npm install
    npm test                  # headless, 5 minutes, results in bombadil/out
    npx bombadil browser inspect out

Other port: `npx bombadil browser test --headless --time-limit=3m http://localhost:3417 specification.ts`.
Needs Chrome/Chromium installed. Reproduce a failure with `--reproduce out`.
