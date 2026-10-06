---
title: 'Docker image never built: postinstall copied into a public/ folder that does not exist yet'
module: 'Docker build and package.json postinstall'
date: 2026-10-06
problem_type: build_error
component: tooling
severity: medium
symptoms:
  - 'docker build fails in the deps stage at RUN pnpm install --frozen-lockfile'
  - "cp: can't create 'public/pdf.worker.min.mjs': No such file or directory"
  - 'ELIFECYCLE Command failed with exit code 1 from the postinstall script'
root_cause: incomplete_setup
resolution_type: code_fix
tags:
  - docker
  - pnpm
  - postinstall
  - build-context
  - pdfjs
---

# Docker image never built: postinstall copied into a public/ folder that does not exist yet

## Problem

The production image could not be built, and nobody noticed because nothing in CI builds it. The first stage of the `Dockerfile` copies only `package.json` and `pnpm-lock.yaml` before running `pnpm install --frozen-lockfile` (`Dockerfile` lines 5-6). The `postinstall` script (`package.json` line 24) copies the PDF worker into `public/`, a folder that only exists once the whole source tree is copied in a later stage. It had been broken since the script was added.

## Symptoms

- `docker build --target runner .` fails at `RUN pnpm install --frozen-lockfile`.
- `cp: can't create 'public/pdf.worker.min.mjs': No such file or directory`, then `ELIFECYCLE ... exit code 1`.
- Locally and in CI it works, because there the full checkout (with `public/`) is already present when `pnpm install` runs.

## What Didn't Work

- Reading `exit 0` from `docker build ... | tail` as success. The pipe hid the real exit status; the build had failed. Check the build's own exit code, or do not pipe it.
- A first retry looked like a network problem (Corepack could not download pnpm inside the VM). That was a one-off while the VM warmed up; the second build got past Corepack and exposed the real failure.

## Solution

Make the script create the target folder first:

```json
"postinstall": "mkdir -p public && cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs"
```

Also add a `.dockerignore` (`.git`, `node_modules`, `out`, `docs`, `coverage`, ...). Without one, the build context included the whole repo and took about 36 s to load.

Verified by building the `runner` target and running it: the page, `/pdf.worker.min.mjs` and `/sample-books/*.epub` return 200 and the process runs as the unprivileged `node` user. Fix is in PR #41 (open as a draft at time of writing).

## Why This Works

`mkdir -p` is a no-op when the folder exists and creates it when it does not, so the same script is correct both in a full checkout and in a Docker stage that has only the manifest files. The full source (including the committed `public/`) is copied later, and the built image gets the worker from the build stage's `public/`.

## Prevention

- Lifecycle scripts (`postinstall`, `prepare`) must not assume paths that a manifest-only Docker stage lacks. Create what you write into.
- Build the image at least once per change that touches `Dockerfile`, install scripts or the lockfile; a green CI that never runs `docker build` proves nothing about the image.
- Never judge a build by `docker build ... | tail`; capture the exit status (`docker build ... > log; echo $?`).
- Two related breakages found in the same pass (same root pattern: a dependency major bump silently broke a tool nobody ran locally): the PDF fuzz harness imported `pdfjs-dist/legacy/build/pdf.js`, which pdfjs v6 no longer ships (now `.mjs`, loaded with a dynamic import from a CommonJS harness), and Stryker mutation testing calls a TypeScript API that TypeScript 7 does not expose (`stryker.config.mjs` now points `tsconfigFile` at a non-existent file so that step is skipped).
