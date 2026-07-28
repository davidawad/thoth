// unlerp has no published types and is a single-function package
// (see node_modules/unlerp/index.js): the inverse of a linear
// interpolation - given a range and a value in it, returns how far
// through the range that value is, as a 0..1 ratio (not clamped).
declare module "unlerp" {
  function unlerp(min: number, max: number, value: number): number;
  export default unlerp;
}
