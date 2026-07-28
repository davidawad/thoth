// @testing-library/jest-dom augments Jest's global `expect` matchers
// (toBeInTheDocument, toHaveClass, etc.). It's imported at runtime in
// setupTests.js, but that import happens via Jest's config (not an ES
// import any test file makes), so the type-checker never sees it unless
// something in the program's `include` set imports it too - this file is
// that import, purely for its global type augmentation side effect.
import "@testing-library/jest-dom";
