# Thoth launch video

A 26-second launch teaser, "One word at a time": a single word locks to a pivot, the red letter pulses, the pace builds until a passage has been read, then the camera pulls back into the two-page book. It ends on a card with the logomark, "Free and open source" and the project name.

| Cut                         | File                                                               | Length |
| --------------------------- | ------------------------------------------------------------------ | ------ |
| 16:9, 1920x1080, with sound | `01-one-word-at-a-time/one-word-at-a-time-16x9-audio.mp4`          | 26.3 s |
| 9:16, 1080x1920, with sound | `01-one-word-at-a-time/one-word-at-a-time-vertical-9x16-audio.mp4` | 26.3 s |
| 16:9, silent master         | `01-one-word-at-a-time/one-word-at-a-time-16x9.mp4`                | 26.3 s |
| 9:16, silent master         | `01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4`       | 26.3 s |

H.264 (yuv420p, 30 fps), AAC stereo 48 kHz on the `-audio` files, about 7 MB in total. The storyboard is in `01-one-word-at-a-time/BRIEF.md`.

## What is in the sound

All synthesized in code (`audio/synth.mjs`): no samples, no downloaded music, no voice. An ambient D-minor pad; a soft tick for each word flip that speeds up with the on-screen pace; a swell and a soft settle as the camera pulls back to the book; the same four-note bell (A4, D5, F5, A5) on the end card, then a decay. Measured with ffmpeg ebur128: -16.0 LUFS integrated, -2.0 dBFS peak. Cue times are read from the page's own timeline, and tick onsets were checked against the picture on the 16:9 cut (within one frame); the vertical cut shares the same cues and was not separately checked.

The pad is plain additive synthesis and may sound thin on good monitors.

## Notes

- The end card reads "Thoth 1.0"; the released app version at the time of writing is v1.3.0.
- The picture and sound are original to this repo; the fonts in `shared/fonts` are OFL-licensed (Atkinson Hyperlegible, Fraunces, Newsreader, IBM Plex Mono).
- The four other concepts explored for this launch (and their sources) are not kept here.

## Regenerate

Needs Node, ffmpeg and ffprobe on `PATH`. The picture is a web page that is a pure function of time; it is stepped frame by frame in a headless Chromium (`playwright-core`, installed here only, not in the app) and encoded with ffmpeg.

```sh
cd docs/launch-video
npm install                      # playwright-core only; then: npx playwright-core install chromium
node render.mjs 01-one-word-at-a-time 01-one-word-at-a-time/one-word-at-a-time-16x9.mp4
node render.mjs 01-one-word-at-a-time 01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4 --v
node audio/build-audio.mjs 01 01v        # synthesizes the sound and muxes it into the silent masters (video stream is copied, never re-encoded)
```

`node audio/build-audio.mjs --cues 01 01v` re-extracts the cue times from the page timeline first. The WAV stems go to `audio/out/` (git-ignored). `audio/verify-sync.py` compares tick onsets against the picture.
