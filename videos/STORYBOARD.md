# thoth stop-motion videos: storyboard

Look: 1920x1080, 10 fps, paper grain that "boils" every frame, torn paper scraps with
drop shadows, every scrap jittered a few px / <1 degree per frame, stickers slapped on
with an overshoot pop. Fonts: Bradley Hand Bold (labels), American Typewriter (numbers),
Chalkduster (quotes). All numbers are computed live from the repo by `data.py`.

## Verified facts (source in parentheses)

- 124 commits on this branch, first 2019-06-17, last 2026-07-28 (`git log`).
  Per year: 2019 = 47, 2022 = 10 (all on 2022-11-23), 2023 = 2, 2024 = 2, 2025 = 18, 2026 = 45.
- 44 commits between 2026-07-27 and 2026-07-28/29 (3 calendar days incl. release commits).
- 2019: Create React App, React 16.8.6, Travis CI added (e732399), milestone PRs, research paper link.
- 2022-11-23: node 18, "upgrade to nextjs", Vercel, PDF parsing temporarily removed.
- Feb-Apr 2025: Tailwind added, Docker + GitHub test workflow, GitLab CI (Apr 2024), Next 15.1.7 /
  React 19 / Tailwind 4.0.7 / daisyUI 4.12.23 / Jest 29.7 (package.json at 82c220c),
  "Huge ass application upgrade." (2025-03-03), PR #40 `color-modes` merged 2025-04-01.
- No commits between 2025-04-01 and 2026-03-28 ("noop").
- July 2026: JS -> TypeScript/TSX, yarn -> pnpm, Jest -> Vitest 4.1.10, oxlint gate, light/dark/sepia
  themes (daisyUI 5), Atkinson Hyperlegible, EPUB upload, Speed Writing, fast-check, Stryker,
  jazzer.js fuzzing, tinybench regression tracking, Zod, Effect, 9-job GitHub Actions CI,
  semantic-release + commitlint, 3 public-domain sample EPUBs.
- Releases: 1.0.0, 1.1.0, 1.1.1, 1.2.0, 1.2.1, 1.2.2 (CHANGELOG.md).
- Versions now: React 19.2.8, Next 16.2.12, Tailwind 4.3.3, daisyUI 5.7.4, TypeScript 7.0.2.
- Tests: 98 test/it cases (static count, 10 files), 31 `fc.assert` property tests, 1355 test lines
  vs 3595 source lines.
- Coverage: _thresholds_ in `vitest.config.ts` (3 modules at 100% lines). Measured coverage was not
  re-run (no node_modules in the worktree), so the videos show the gates, not a percentage.
- Mutation: Stryker over 4 files; 25.58% baseline -> 70.71%, break gate 65 (comment in `stryker.config.mjs`).
- Fuzz: 2 jazzer.js targets (EPUB extract-text, PDF document parse). Bench: 8 benchmarks vs `bench/baseline.json`.
- CI jobs: lint, typecheck, test, build, fuzz, mutation, sast, dependency-scan, secret-scan.

Not claimed: user counts, speed-up numbers, Lighthouse scores, anything from `art/`.
The task brief said 129 commits; this branch has 124.

## Video 1: 01-timeline.mp4 (45.5s) "seven years in 124 commits"

| Time       | Scene                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| 0-4s       | Title cards THOTH letter by letter, "a speed-reading app, hand-built"          |
| 4-11s      | 2019: CRA / React 16.8.6, real commit subjects slap on, counter to 47          |
| 11-15.5s   | Nov 2022: 10 commits in one day, nextjs + Vercel panic                         |
| 15.5-21.5s | Feb-Apr 2025: Tailwind/daisyUI/Docker, "Huge ass application upgrade.", PR #40 |
| 21.5-25.5s | The gap: "0 commits", then "noop"                                              |
| 25.5-36.5s | 44 commits in 3 days: flurry of real subjects, counter 81 -> 124               |
| 36.5-41.5s | semantic-release chips v1.0.0 ... v1.2.2                                       |
| 41.5-45.5s | End card: 124 commits, 7 years                                                 |

## Video 2: 02-quality-stack.mp4 (47.5s) "rigor"

Title QA -> tests counter (98) + property tests -> coverage gates (3 modules at 100%) ->
mutation bar crawling 25.58% -> 70.71% with the 65% break line -> fuzz (random garbage
text, 2 targets) -> benchmarks (8) -> CI job stickers (9) -> end card.

## Video 3: 03-stack-upgrades.mp4 (46.5s) "new bones"

Title -> six "old card slides off, new card slaps on" swaps (React 16.8.6 -> 19.2.8, Next 15.1.7 ->
16.2.12, Tailwind 4.0.7 -> 4.3.3, daisyUI 4.12.23 -> 5.7.4, TypeScript 5.7.3 -> 7.0.2,
Jest 29.7.0 -> Vitest 4.1.10) -> three theme swatches -> RSVP reader demo (one word at a time,
red pivot letter) -> end card.

## Raw material for a launch cut

Each scene is an independent function in `build.py`; render a single scene by editing the scene list,
or cut the MP4 apart at the times above. Real app screen recordings (not included) would slot between
scenes 5 and 6 of video 3.

## Rebuild

    cd videos && python3 build.py all      # needs python3 + Pillow + numpy + ffmpeg, macOS fonts
    python3 build.py timeline|quality|stack

Frames go to /tmp/thoth-videos-frames, MP4s to `videos/out/` (gitignored).
