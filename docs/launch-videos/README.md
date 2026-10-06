# Thoth 1.0 launch concept videos

Motion-graphic concepts. The original files are silent; each has an `-audio.mp4` sibling with an original synthesized sound design (no voiceover, no samples, no music downloaded). Everything is rendered frame by frame: each concept is an HTML page that is a pure function of time (`window.seek(t)`), stepped by `render.mjs` (Playwright's bundled Chromium via `playwright-core`), JPEG frames piped to ffmpeg (libx264, yuv420p, BT.709, CRF 20, 30 fps). Open any `index.html` in a browser to watch it live (click to restart). Fonts are the OFL files already used by the mockups (Fraunces, Newsreader, IBM Plex Mono, Atkinson Hyperlegible), in `shared/fonts/`.

| #   | Concept                      | One-line pitch                                                                         | Length | How it was made                                          | File                                                                                                                     |
| --- | ---------------------------- | -------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | One word at a time           | The pivot word accelerates to 500 wpm, then pulls back into the glowing two-page book. | 26.3 s | HTML/JS timeline, recreated UI                           | [01-one-word-at-a-time/one-word-at-a-time-16x9.mp4](01-one-word-at-a-time/one-word-at-a-time-16x9.mp4)                   |
| 1v  | One word at a time, vertical | 9:16 cut of concept 1 (single page).                                                   | 26.3 s | same page, `?v=1`                                        | [01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4](01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4) |
| 2   | Your eyes can rest           | A scanning eye on a dense page, then everything collapses to one still point.          | 23.2 s | HTML/JS + canvas trail, typographic                      | [02-your-eyes-can-rest/your-eyes-can-rest-16x9.mp4](02-your-eyes-can-rest/your-eyes-can-rest-16x9.mp4)                   |
| 3   | Open the book                | Heat-map ripple, travelling sentence glow, 3D page turn, theme and palette sweep.      | 27.7 s | HTML/CSS 3D, recreated UI                                | [03-open-the-book/open-the-book-16x9.mp4](03-open-the-book/open-the-book-16x9.mp4)                                       |
| 4   | Drop any book                | An EPUB drops, a library card resolves, a padlock closes: stays in your browser.       | 25.8 s | HTML/JS, recreated UI                                    | [04-drop-any-book/drop-any-book-16x9.mp4](04-drop-any-book/drop-any-book-16x9.mp4)                                       |
| 5   | See it run                   | Real screen-capture of the running app with camera pushes and captions.                | 25.6 s | Playwright CDP screencast of the real app + HTML overlay | [05-real-app/see-it-run-16x9.mp4](05-real-app/see-it-run-16x9.mp4)                                                       |

Each folder has a `BRIEF.md` (beat-by-beat storyboard). Every video ends on the same end card: logomark, "Thoth 1.0", "Free and open source", github.com/davidawad/thoth (the URL was checked: `curl -sIL` returned HTTP 200).

Not done: Seshat + Thoth pairing concept (only the siblings-of-a-flashcard-app fact is available, so it was skipped rather than padded).

## Rebuild

```
cd docs/launch-videos
npm install            # playwright-core only; uses the Playwright browsers already cached on the machine
./render-all.sh        # all videos (05 needs 05-real-app/capture, made by: node 05-real-app/capture.mjs, with the app on :4817)
node frames.mjs 03-open-the-book 5,12,20   # stills to the scratch dir for review
```

## Audio

Every concept has `<name>-audio.mp4` next to the silent `<name>.mp4`. The H.264 stream is copied bit-for-bit (`-c:v copy`, verified by identical stream md5); audio is stereo 48 kHz AAC 192 kbps, starting at 0 and ending with the video. All sound is synthesized in `audio/synth.mjs` (sines, filtered noise, a small Schroeder reverb); nothing is sampled or downloaded. Shared pieces: a quiet D-minor pad with slow chord changes and a little air, and the same end-card motif everywhere (A4, D5, F5, A5 bells over a low D, then a natural decay and a fade).

| #   | Audio file                                                       | Measured integrated | True peak | Cues                                                                                                                    |
| --- | ---------------------------------------------------------------- | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | 01-one-word-at-a-time/one-word-at-a-time-16x9-audio.mp4          | -16.0 LUFS          | -2.0 dBTP | word ticks accelerate with the pace, swell on the pull-back, settle thud, 500 wpm ticks on the pill, end-card motif     |
| 1v  | 01-one-word-at-a-time/one-word-at-a-time-vertical-9x16-audio.mp4 | -16.0 LUFS          | -2.0 dBTP | same score as 1 (identical timeline)                                                                                    |
| 2   | 02-your-eyes-can-rest/your-eyes-can-rest-16x9-audio.mp4          | -16.1 LUFS          | -2.0 dBTP | paper scratch per saccade, swish on line returns, inward whoosh on the collapse, low settling tone, air, end-card motif |
| 3   | 03-open-the-book/open-the-book-16x9-audio.mp4                    | -16.0 LUFS          | -2.0 dBTP | rising ripple notes per sentence, sparkle shimmer over the glow, paper swish + thud on the turn, palette notes          |
| 4   | 04-drop-any-book/drop-any-book-16x9-audio.mp4                    | -16.0 LUFS          | -2.0 dBTP | drop thud and settle, ingest ticks, row ticks as metadata resolves, padlock click, ribbon thump                         |
| 5   | 05-real-app/see-it-run-16x9-audio.mp4                            | -16.0 LUFS          | -2.0 dBTP | word ticks on the frames where the footage head word changes, UI clicks, swish shaped by the captured page-turn motion  |

Loudness is measured on the final AAC with ffmpeg `ebur128` (all files LRA about 7 LU). Gain and a -2 dBFS safety limiter are applied before encoding.

What is synced to the timeline and what is approximate:

- Exact (read from the page timeline constants by `audio/extract-cues.mjs`, which runs the real pages): concepts 1 to 4 word ticks, pull-back, scan saccades and line returns (line returns are detected from the real word positions), collapse, RSVP words, page turn start and end, heat-map sentence onsets, theme-switch starts, drop, ingest phase labels, metadata rows, padlock, ribbon, end card.
- Exact (frame-differenced from the captured footage by `audio/detect-05.py`, then mapped through the video's own cut table): concept 5 word steps, page-turn motion envelope, theme switches. Verified by decoding the final file: audio onsets sit 0 to 1 frame before the matching visual change.
- Approximate: concept 5 Play and open-sample clicks and the Space tick (inferred from the capture script order, not visible state changes); the sound character of every cue (levels, pitches, textures) is a design choice, not derived from anything on screen.

Regenerate:

```
cd docs/launch-videos
node audio/build-audio.mjs            # renders every track from audio/cues/*.json, normalises, muxes the -audio.mp4 files
node audio/build-audio.mjs 03 05      # only some ids (01 01v 02 03 04 05)
node audio/build-audio.mjs --cues     # re-read cues from the pages first (concepts 1 to 4)
python3 audio/detect-05.py            # re-derive concept 5 cues (needs 05-real-app/capture/ from capture.mjs)
python3 audio/verify-sync.py FILE x0,y0,x1,y1 t0 t1   # spot-check ticks against visual changes in a region
```

WAV intermediates go to `audio/out/` (git-ignored). The audio is machine-checked (loudness, peaks, duration, sync) but has not been auditioned by ear: give it a listen on speakers and headphones before publishing.
