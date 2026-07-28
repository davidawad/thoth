// Shared app-level settings shape. This flows: pages/index.tsx's top-level
// App state -> spread as props into Reader/ModalWrapper/FileParser ->
// SettingsPanel (via updateCallback) -> bubbled back up and merged into
// App state. Kept here (not in constants.ts, which is for values) since
// several components need the same prop-shape contract.
export interface AppSettings {
  year?: number;
  content?: string;
  readingSpeed?: number;
  baseColorStop?: string;
  finalColorStop?: string;
  scrollingEnabled?: boolean;
  age?: number;
  verbose?: boolean;
  readabilityMetric?: string;
  speedWritingEnabled?: boolean;
}

export type UpdateCallback = (settings: Partial<AppSettings>) => void;
