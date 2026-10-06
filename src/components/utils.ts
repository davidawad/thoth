// https://ml-cheatsheet.readthedocs.io/en/latest/activation_functions.html#sigmoid
const sigmoid = function computeSigmoidofAge(z: number): number {
  return 1 / (1 + Math.exp(-z));
};

function roundToPrecision(x: number, precision?: number): number {
  const y = +x + (precision === undefined ? 0.5 : precision / 2);
  // Stryker disable next-line UnaryOperator: +precision -> -precision is a
  // mathematically equivalent mutant, not a test gap. JS's `%` result sign
  // and magnitude depend only on the dividend and the divisor's *magnitude*
  // - never the divisor's sign (e.g. 1.28 % 0.1 === 1.28 % -0.1 and
  // -1.28 % 0.1 === -1.28 % -0.1, verified directly). No input can ever
  // distinguish +precision from -precision here.
  return y - (y % (precision === undefined ? 1 : +precision));
}

// Formats a seconds value for display with at most 2 decimals. Rounding in
// binary floating point leaves noise like 7.3500000000000005, so this goes
// through toFixed() (and Number() to drop trailing zeros and any "-0").
function formatSeconds(seconds: number): string {
  return Number(seconds.toFixed(2)).toString();
}

// The keys whose values differ between two props/settings objects. Used so a
// parent re-render that passes identical values (e.g. opening the Settings
// modal) is not mistaken for a settings change.
function changedKeys<T extends object>(previous: T, next: T): (keyof T)[] {
  return (Object.keys(next) as (keyof T)[]).filter(
    (key) => previous[key] !== next[key],
  );
}

const funcs = { sigmoid, roundToPrecision, formatSeconds, changedKeys };
export default funcs;
