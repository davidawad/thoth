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

const funcs = { sigmoid, roundToPrecision };
export default funcs;
