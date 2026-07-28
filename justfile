default: help

help:
    @just --list

install:
    pnpm install

run: dev

dev:
    pnpm dev

build:
    pnpm build

start: build
    pnpm start

lint:
    pnpm exec oxlint --deny-warnings

typecheck:
    pnpm exec tsc --noEmit

test:
    pnpm test

test-watch:
    pnpm test:watch

coverage:
    pnpm test:coverage

mutation:
    pnpm test:mutation

bench:
    pnpm bench

fuzz:
    pnpm run fuzz:epub
    pnpm run fuzz:pdf

clean:
    rm -rf .next
