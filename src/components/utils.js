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
