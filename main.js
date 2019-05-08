var paused = true

window.index = 0

// speed in words per minute
let READING_SPEED = 500
let MAX_WORD_SIZE = 8

// hyphenating
//    if <= 7 chars
//      return self
//    if <= 10
//    return x, {3}
//    if <= 14 chars
//    return {7},{7}
//    else
//    return {7}, hyphenated{x}

let hyphenate = function(word) {
    let ret = word
    let len = word.length

    // console.log(word, len)

    // TODO idfk what this is doing rn
    ret = len < MAX_WORD_SIZE ? word : len < 11 ? word.slice(0, len - 3) + '- ' + word.slice(len - 3) : word.slice(0,7) + '- ' + hyphenate(word.slice(7))

    // if (len >= 7 && len < 11) {
        // ret = word.slice(0, len - 3) + '- ' + word.slice(len - 3)
    // }

    // if (len > 11) {
        // ret = word.slice(0, 7) + '- ' + hyphenate(word.slice(7))
    // }


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

            let focus
            let len = str.length

            // focus point is typically going to be
            // the first vowel in the word
            for (let j = focus = (len - 1) / 2 | 0; j >= 0;  j--) {

                if (/[aeiou]/.test(str[j])) {
                    focus = j
                    break
                }
            }

            // time that this word will be displayed
            let t = 60000 / READING_SPEED

            if (len > 6) {
                t += t/4
            }

            if (~str.indexOf(',')) {
                t += t/2
            }

            if (/[.?!]/.test(str)) {
                t += t * 1.5
            }

            let ret = words.concat([[str, focus, t]])

            if (len > 14 || len - focus > 7 ) {
                ret = words.concat(parse(hyphenate(str)))
            }

            return ret

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
    paused = true
}

function pause() {
    paused = true
}

function reset() {
    pause()
    window.index = 0
}

// switch from paused to playing and vice versa
function playpause() {
    if (paused) {
        play()
    } else {
        pause()
    }
}

// stick the tape in the VHS player ~
// take our array and a certain index and display the words in a recursive calling loop.
function loop(arr, index) {

    // are we at the end of the reading
    if (index === arr.length){
        // reset index when done reading
        window.index = 0
        return
    }

    if (paused) { return }

    // word object
    let w = arr[index]
    let display_word = w[0]
    let hot_char_ind = w[1]
    let timer        = w[2]


    // 8 here is the string size
    let display_HTML = Array(MAX_WORD_SIZE - hot_char_ind).join('&nbsp;') +
                        display_word.slice(0, hot_char_ind) +
                        '<v>' +
                        display_word[hot_char_ind] + // inject our hot letter
                        '</v>' +
                        display_word.slice(hot_char_ind + 1)


    canvas.innerHTML = display_HTML

    // make recursive call
    window.index++

    let next_callback = function(){ loop(arr, window.index) }
    setTimeout(next_callback, timer)
}




// to play instantly on page load
// p()
