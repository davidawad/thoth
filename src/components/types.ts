// Shared app-level settings shape. This flows: pages/index.tsx's top-level
// App state -> spread as props into Reader/ModalWrapper/FileParser ->
// SettingsPanel (via updateCallback) -> bubbled back up and merged into
// App state. Kept here (not in constants.ts, which is for values) since
// several components need the same prop-shape contract.
//
// Every field is `T | undefined` rather than `T?` on purpose: this app
// always explicitly assigns `undefined` (resetting currentFile on a new
// drop, propagating an out-of-range page, etc.) rather than omitting keys.
// With exactOptionalPropertyTypes, `field?: T` forbids explicit `undefined`
// assignment (only omission) - `field: T | undefined` allows both, matching
// how this state is actually used everywhere it flows.
export interface AppSettings {
  year: number | undefined;
  content: string | undefined;
  readingSpeed: number | undefined;
  baseColorStop: string | undefined;
  finalColorStop: string | undefined;
  scrollingEnabled: boolean | undefined;
  age: number | undefined;
  verbose: boolean | undefined;
  readabilityMetric: string | undefined;
  speedWritingEnabled: boolean | undefined;
}

export type UpdateCallback = (settings: Partial<AppSettings>) => void;
