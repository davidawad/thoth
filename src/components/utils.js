
// I thought a sigmoid might be useful for a continuous input / output 
// smoothing for time delay. probably won't be necessary. 

// Sigmoid takes a real value as input and outputs another value between 0 and 1. 
// It’s easy to work with and has all the nice properties of activation functions: 
// it’s non-linear, continuously differentiable, monotonic, and has a fixed output range.

// https://ml-cheatsheet.readthedocs.io/en/latest/activation_functions.html#sigmoid
const sigmoid = function computeSigmoidofAge(z) {
    return 1 / (1 + Math.exp(-z)); 
}


function roundToPrecision(x, precision) {
    var y = +x + (precision === undefined ? 0.5 : precision/2);
    return y - (y % (precision === undefined ? 1 : +precision));
}

const funcs = { sigmoid, roundToPrecision};
export default funcs;
