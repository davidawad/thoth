## [1.2.2](https://github.com/davidawad/thoth/compare/v1.2.1...v1.2.2) (2026-07-29)


### Bug Fixes

* remove the broken Highlight button ([b639b50](https://github.com/davidawad/thoth/commit/b639b50d77054b3b7dbd2a3c75dccff2814d46fa))

## [1.2.1](https://github.com/davidawad/thoth/compare/v1.2.0...v1.2.1) (2026-07-29)


### Bug Fixes

* add a close (x) button to the settings modal ([3cd8404](https://github.com/davidawad/thoth/commit/3cd8404513d2aaab617bfa21e4e93cc0f5bae3a5))

# [1.2.0](https://github.com/davidawad/thoth/compare/v1.1.1...v1.2.0) (2026-07-29)


### Features

* cite the original RSVP research paper and rework the page layout ([535aa60](https://github.com/davidawad/thoth/commit/535aa60a4b22870809e6aa7c8ac555e4b832e850))

## [1.1.1](https://github.com/davidawad/thoth/compare/v1.1.0...v1.1.1) (2026-07-28)


### Bug Fixes

* rework page navigation into real, accessible, clearly-labeled buttons ([a651685](https://github.com/davidawad/thoth/commit/a65168537058591f3d119482e0e750359d76dee2))
* skip cover/license front-matter and Gutenberg back-matter when parsing EPUBs ([21ce1ae](https://github.com/davidawad/thoth/commit/21ce1ae34a0970f291f5cbf813e4579f93ba1a71))
* spacebar play/pause outside inputs, stop neighbor words shifting the pivot word ([3343976](https://github.com/davidawad/thoth/commit/334397616025279ed1af4ba685ee6bdbe0ac87a3))
* stop leaking dropzone drag-state as invalid DOM attributes ([e07a243](https://github.com/davidawad/thoth/commit/e07a243d1b857282828415cbdc522af791ef8497))
* use a solid color for the reading progress bar ([ef0a949](https://github.com/davidawad/thoth/commit/ef0a949726b38e603615ca6f436a7581868fc763)), closes [#FF0000](https://github.com/davidawad/thoth/issues/FF0000)

# [1.1.0](https://github.com/davidawad/thoth/compare/v1.0.0...v1.1.0) (2026-07-28)


### Features

* add Makefile and justfile task runners ([c38cade](https://github.com/davidawad/thoth/commit/c38cade703baa30721209ed459502873c258c87c))

# 1.0.0 (2026-07-28)


### Bug Fixes

* add vscode to gitignore ([cda63f9](https://github.com/davidawad/thoth/commit/cda63f908f8e2785e7b22cb9e39493248919d532))
* change link to vercel ([e018282](https://github.com/davidawad/thoth/commit/e01828206758f1fba4e675c44ced62a15ddbfe33))
* move all css imports to _app js for nextjs upgrade ([b861c66](https://github.com/davidawad/thoth/commit/b861c660f9e12de7b9ff30295f61177659c20e0b))
* removing pdf parsing because these deployment issues are stupid ([56f1eee](https://github.com/davidawad/thoth/commit/56f1eee2965254bc3187ae1c0ea1fd31cf9ca3af))
* repair the core reading pipeline and PDF upload end-to-end ([9a96f0e](https://github.com/davidawad/thoth/commit/9a96f0ec0fbeb144c71a1a7c511581873c5b1b1d))
* unbreak CI - exclude next-env.d.ts from lint, fix coverage thresholds ([1295e6d](https://github.com/davidawad/thoth/commit/1295e6d04dc58a459d5cdfd81d2b8d463ad04954))
* upgrade to nextjs ([f08f36e](https://github.com/davidawad/thoth/commit/f08f36e0a33e6619697fc5c3436118ed46648e98))
* upgrade to nextjs ([2089085](https://github.com/davidawad/thoth/commit/2089085f18204bfb301d50aaa643272f9b42192f))
* vercel ([f5d0ed9](https://github.com/davidawad/thoth/commit/f5d0ed95c4038460b8d7fb2df2e701fb4878a7f5))
* vercel change for deployment ([0f2f94b](https://github.com/davidawad/thoth/commit/0f2f94bca75cbc171bc6f7fe72a1bb39f1055df8))


### Features

* add mutation testing with Stryker ([58f0e01](https://github.com/davidawad/thoth/commit/58f0e01efb14c85326a10b900a3a26c81327de82))
* add property tests with fast-check ([6c7727d](https://github.com/davidawad/thoth/commit/6c7727dfb6cd441e4a2fb10988c4d63db361ec68))
* add semantic-release and commitlint ([c3ad985](https://github.com/davidawad/thoth/commit/c3ad985178d28fde21f2cc83980020b0d03de7ec))
* convert pages/*.js to TSX - full app is now TypeScript ([3e2084f](https://github.com/davidawad/thoth/commit/3e2084fbe0066467d32574378f46608ab00eeeea))
* convert parser components to TSX ([7d2b7ce](https://github.com/davidawad/thoth/commit/7d2b7cecfe6ae959c7a4cd1ae04e0965b3188325))
* convert Reader.js to TSX ([8f0c46d](https://github.com/davidawad/thoth/commit/8f0c46d8f7efe6c2820b0aa4b0a53e0b3734fd74))
* convert simple components to TSX ([8d0ec0e](https://github.com/davidawad/thoth/commit/8d0ec0e43c2827488ae20f0fd12dc3df81ec6c76))
* convert utility/logic files to TypeScript ([93bcc1e](https://github.com/davidawad/thoth/commit/93bcc1e192c58432c846e64f50176e2157933e7a))
* dark/light/sepia themes, Atkinson Hyperlegible typography, legibility pass ([55fd893](https://github.com/davidawad/thoth/commit/55fd89390b3e8b45b9f87083281fa69b956da628))
* graduated per-word difficulty scaling + selectable readability metric ([b62bd73](https://github.com/davidawad/thoth/commit/b62bd731a5b18fe44153c7b6f772e9804163263c))
* migrate Jest to Vitest ([8937226](https://github.com/davidawad/thoth/commit/893722679e7a89f6f63d360135eaaf52b37e6aa7))
* opt-in Speed Writing (paper §8.4) - simplify difficult words before reading ([50ce58e](https://github.com/davidawad/thoth/commit/50ce58ebb4d06e93ae7dddcbad6249ea0e2143cc))
* ship public-domain sample books with a one-click picker ([8177088](https://github.com/davidawad/thoth/commit/8177088cd56a16233b1194feae37114c8374ef6e))
* wire EPUB upload into the RSVP reader pipeline ([6f3fece](https://github.com/davidawad/thoth/commit/6f3fece05f3137fc636dc7885669a24b58c9c893))
