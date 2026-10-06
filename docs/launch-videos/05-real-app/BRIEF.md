# 05 See it run (real captured footage)

Pitch: no mock-ups. The running Thoth app, driven by a script, with a camera push on the RSVP head, the real book open, the real 3D page turn (slowed to 0.3x) and the real theme switch.
Length 25.6 s. Source: `capture.mjs` (Playwright-bundled Chromium + CDP screencast of http://localhost:4817, dark scheme, 1920x1080), `index.html` (conforms the variable-rate frames to 30 fps, adds camera, captions, end card). The raw frames (`capture/`, ~90 MB) are git-ignored; rerun `capture.mjs` with the app running to regenerate. Footage shows the app's own footer version (v1.2.2): the tag "Screen capture of the running app" is the only claim made about it.

| Time      | Beat      | On-screen                                                                                                                                                   | Motion                                       |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0.0-6.2   | Landing   | tag "Screen capture of the running app"; Play pressed, words stream through the head; caption "One word at a time. The red letter is where your eye rests." | camera pushes 1x -> 2x on the head, back out |
| 6.2-9.7   | Open      | click the Meditations sample; spread appears; caption "Open a built-in public-domain book."                                                                 | dip-cut                                      |
| 9.7-13.7  | Read      | Space plays: head runs, sentence glows; caption "The current sentence glows while the playback head runs."                                                  | slow 1.15x push                              |
| 13.7-16.1 | Page turn | real 3D page turn at 0.3x speed; caption "A two-page spread with a 3D page turn."                                                                           | slow motion from 60 fps source               |
| 16.1-20.4 | Themes    | light, sepia, dark clicked in the settings row (gold ring on the theme control); caption "Light, sepia and dark themes."                                    | pulsing ring                                 |
| 21.2-25.6 | End card  | standard                                                                                                                                                    | standard                                     |
