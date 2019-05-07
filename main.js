// d()

var playing, loop, parse, focus, paused;

window.index = 0

// hyphenating
//    if <= 7 chars
//      return self
//    if <= 10
//    return x, {3}
//    if <= 14 chars
//    return {7},{7}
//    else
//    return {7}, hyphenated{x}

let hyphenate = function(words) {
    // console.log(words)
    let ret = words

    with(words) {
        ret = length < 8 ? words : length < 11 ? slice(0,length - 3) + '- ' + slice(length-3) : slice(0,7) + '- ' + hyphenate(slice(7))

    }

    return ret
}


parse = function(words) {
    // Logic
    // strings will be broken out into words
    // find the focus point of the word
    // if, when the word is shifted to its focus point
    //   one end prodtrudes from either end more than 7 chars
    //   re-run parser after hyphenating the words

    // focus point
    // start in middle of word (default focus point)
    // move left until you hit a vowel, then stop

    // return 2d array with word and focus point
    return words.trim()
        .replace(/([.?!])([A-Z-])/g, '$1 $2')
        .split(/\s+/)
        .reduce(function(words, str) {
            with(str) {
                // focus point
                for(let j = focus = (length - 1) / 2 | 0; j >= 0;  j--) {

                    if (/[aeiou]/.test(str[j])) {
                        focus = j
                        break;
                    }
                }

                // time on page
                let t = 60000/500 // 500 wpm

                if (length > 6)
                    t += t/4

                if (~indexOf(',')){
                    t += t/2
                }

                if(/[.?!]/.test(str)) {
                    t+= t*1.5
                }

                return length > 14 || length - focus > 7 ? words.concat(parse(hyphenate(str))) : words.concat([[str, focus, t]])
            }
        }, [])
}


function play() {
    let arr = parse(word_content.textContent)

    if (paused) {
        // continue playing
        paused = false
        loop(arr, window.index)
        return
    }

    // play from beginning
    loop(arr, 0)
}

function pause() {
    paused = true
}


// stick the tape in the VHS player ~
loop = function(arr, index) {

    console.log(index)

    if (paused) { return }

    // word object
    var w = arr[index]


    // 8 here is the string size
    canvas.innerHTML = Array(8 - w[1]).join('&nbsp;') +
        w[0].slice(0, w[1]) +
        '<v>' +
        w[0][w[1]] + // inject our hot letter
        '</v>' +
        w[0].slice(w[1] + 1)

    // make recursive call
    window.index++

    let next_callback = function(){loop(arr, window.index)}
    setTimeout(next_callback, w[2])
}






// to play instantly on page load
// p()
