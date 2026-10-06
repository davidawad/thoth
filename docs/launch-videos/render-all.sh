#!/bin/sh
# Re-renders every concept (05-real-app needs ./05-real-app/capture from capture.mjs and the app on :4817)
cd "$(dirname "$0")"
node render.mjs 01-one-word-at-a-time 01-one-word-at-a-time/one-word-at-a-time-16x9.mp4
node render.mjs 01-one-word-at-a-time 01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4 --v
node render.mjs 02-your-eyes-can-rest 02-your-eyes-can-rest/your-eyes-can-rest-16x9.mp4
node render.mjs 03-open-the-book 03-open-the-book/open-the-book-16x9.mp4
node render.mjs 04-drop-any-book 04-drop-any-book/drop-any-book-16x9.mp4
node render.mjs 05-real-app 05-real-app/see-it-run-16x9.mp4
# audio: node audio/build-audio.mjs (see README)
