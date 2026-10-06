# Thoth 1.0 launch concept videos

Silent motion-graphic concepts (no audio, no music). Everything is rendered frame by frame: each concept is an HTML page that is a pure function of time (`window.seek(t)`), stepped by `render.mjs` (Playwright's bundled Chromium via `playwright-core`), JPEG frames piped to ffmpeg (libx264, yuv420p, BT.709, CRF 20, 30 fps). Open any `index.html` in a browser to watch it live (click to restart). Fonts are the OFL files already used by the mockups (Fraunces, Newsreader, IBM Plex Mono, Atkinson Hyperlegible), in `shared/fonts/`.

| #   | Concept                      | One-line pitch                                                                         | Length | How it was made                                          | File                                                                                                                     |
| --- | ---------------------------- | -------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | One word at a time           | The pivot word accelerates to 500 wpm, then pulls back into the glowing two-page book. | 26.3 s | HTML/JS timeline, recreated UI                           | [01-one-word-at-a-time/one-word-at-a-time-16x9.mp4](01-one-word-at-a-time/one-word-at-a-time-16x9.mp4)                   |
| 1v  | One word at a time, vertical | 9:16 cut of concept 1 (single page).                                                   | 26.3 s | same page, `?v=1`                                        | [01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4](01-one-word-at-a-time/one-word-at-a-time-vertical-9x16.mp4) |
| 2   | Your eyes can rest           | A scanning eye on a dense page, then everything collapses to one still point.          | 23.2 s | HTML/JS + canvas trail, typographic                      | [02-your-eyes-can-rest/your-eyes-can-rest-16x9.mp4](02-your-eyes-can-rest/your-eyes-can-rest-16x9.mp4)                   |
| 3   | Open the book                | Heat-map ripple, travelling sentence glow, 3D page turn, theme and palette sweep.      | 27.7 s | HTML/CSS 3D, recreated UI                                | [03-open-the-book/open-the-book-16x9.mp4](03-open-the-book/open-the-book-16x9.mp4)                                       |
| 4   | Drop any book                | An EPUB drops, a library card resolves, a padlock closes: stays in your browser.       | 25.8 s | HTML/JS, recreated UI                                    | [04-drop-any-book/drop-any-book-16x9.mp4](04-drop-any-book/drop-any-book-16x9.mp4)                                       |
| 5   | See it run                   | Real screen-capture of the running app with camera pushes and captions.                | 25.6 s | Playwright CDP screencast of the real app + HTML overlay | [05-real-app/see-it-run-16x9.mp4](05-real-app/see-it-run-16x9.mp4)                                                       |

Each folder has a `BRIEF.md` (beat-by-beat storyboard). Every video ends on the same end card: logomark, "Thoth 1.0", "Free and open source", github.com/davidawad/thoth (the URL was checked: `curl -sIL` returned HTTP 200).

Not done: Seshat + Thoth pairing concept (only the siblings-of-a-flashcard-app fact is available, so it was skipped rather than padded); no audio.

## Rebuild

```
cd docs/launch-videos
npm install            # playwright-core only; uses the Playwright browsers already cached on the machine
./render-all.sh        # all videos (05 needs 05-real-app/capture, made by: node 05-real-app/capture.mjs, with the app on :4817)
node frames.mjs 03-open-the-book 5,12,20   # stills to the scratch dir for review
```
