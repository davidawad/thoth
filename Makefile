.DEFAULT_GOAL := help
.PHONY: help install run dev build start lint typecheck test test-watch coverage mutation bench fuzz clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

run: dev ## Alias for `dev`

dev: ## Start the Next.js dev server
	pnpm dev

build: ## Production build
	pnpm build

start: build ## Build and run the production server
	pnpm start

lint: ## Lint (oxlint)
	pnpm exec oxlint --deny-warnings

typecheck: ## Type-check (tsc --noEmit)
	pnpm exec tsc --noEmit

test: ## Run the unit/property test suite
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm test:watch

coverage: ## Run tests with coverage
	pnpm test:coverage

mutation: ## Run Stryker mutation testing
	pnpm test:mutation

bench: ## Run perf benchmarks and compare against the committed baseline
	pnpm bench

fuzz: ## Run both jazzer.js fuzz targets (bounded, ~30s each)
	pnpm run fuzz:epub
	pnpm run fuzz:pdf

clean: ## Remove build output
	rm -rf .next
