import { bench, describe } from 'vitest';
import utils from '../src/components/utils';

// sigmoid/roundToPrecision back the per-word display-time curve - called
// once per word of whatever's currently loaded in the reader.
describe('utils', () => {
  bench('sigmoid', () => {
    utils.sigmoid(12.5);
  });

  bench('roundToPrecision', () => {
    utils.roundToPrecision(1.23456, 0.1);
  });
});
