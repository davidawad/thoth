# 03 Open the book (UI showpiece, recreated in HTML)

Pitch: the two-page spread rises, a difficulty heat map ripples green to red across the sentences, the glow travels with the playback head, a 3D page turn, then dark -> light -> sepia -> slate -> sage -> back to dark.
Length 27.7 s. Source: `index.html` (CSS 3D leaf for the page turn; tokens from `docs/mockups/book-view/08-spotlight-v2.html` and the real palettes: archive, slate, sage). Real UI chrome: back link/title, playback head, settings row (speed, text size, theme, palette, spotlight dim, contents).

| Time      | Beat      | On-screen                                                                                                                                                                                                | Motion                             |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 0.2-2.3   | Title     | "Open the _book._"                                                                                                                                                                                       | fade/rise, then lifts away         |
| 1.1-3.0   | Book up   | spread, ribbon, chrome                                                                                                                                                                                   | translate/rotateX/scale ease-out   |
| 3.4-6.6   | Heat map  | sentences tint green (easier) to red (harder) as a ripple from the spine; legend "Easier ... Harder (relative to the rest of this text)"; caption "Difficulty heat map: green is easier, red is harder." | delay by distance from centre      |
| 7.0-14.3  | Glow      | page dims, current sentence glows, current word red-tinted, playback head word flashes at 500 wpm; caption "The current sentence glows. The rest of the page steps back."                                | cursor at 500 wpm                  |
| 14.3-16.1 | Page turn | right page flips about the spine, shading and cast shadow; caption "A two-page spread, with a real page turn."                                                                                           | rotateY 0 -> -180, cubic in-out    |
| 16.5-22.5 | Themes    | light, sepia, slate, sage palettes in turn, segmented controls update; caption "Dark, light, sepia. Five palettes."                                                                                      | colour tokens interpolated in sRGB |
| 23.3-27.7 | End card  | standard (forced back to brand dark)                                                                                                                                                                     | standard                           |

Weak spot: the heat values per sentence are illustrative (the app computes them), only the look is real.
