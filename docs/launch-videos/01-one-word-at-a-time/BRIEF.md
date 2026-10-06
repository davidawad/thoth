# 01 One word at a time (hero cut, 16:9 + 9:16)

Pitch: one word locks to a pivot, the red letter pulses, the pace builds to 500 wpm, then the camera lands back on the page: the same passage in the two-page book, current sentence glowing.
Length 26.3 s. Source: `index.html` (HTML/CSS/JS, deterministic `seek(t)` timeline). `?v=1` switches to the 9:16 layout (single page instead of a spread).
Tagline used: "One word at a time." / "The red letter marks where to rest your eye." (the app's own copy) / "Then back to the page."

| Time      | Beat      | On-screen                                                                                                                                               | Motion                                                                                                  |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 0.0-1.5   | Hush      | "Thoth 1.0" mono tag, two gold ticks (the playback-head guides) grow in                                                                                 | ticks scaleY ease-out, warm glow dot behind the pivot                                                   |
| 1.5-12.8  | The ramp  | Words of the Meditations sample, one at a time, red pivot letter fixed at screen centre; mono readout "130 wpm" climbing to "500 wpm" with a gold bar   | interval eases 0.55 s -> 0.12 s per word; red letter scales 1.16 -> 1 and its glow decays on every word |
| 1.0-4.1   | Caption   | "One word at a time."                                                                                                                                   | fade up/out                                                                                             |
| 5.2-10.4  | Caption   | "The red letter marks where to rest your eye."                                                                                                          | fade up/out                                                                                             |
| 13.2-15.0 | Pull-back | last word shrinks up into the playback-head pill; the book rises (tilt 10 deg -> 0, scale 1.12 -> 1)                                                    | cubic in-out, word fades before the book arrives                                                        |
| 15.4-20.6 | The page  | Pill word keeps flashing at 500 wpm while the same sentences glow on the page, others dimmed; current word red-tinted. Caption "Then back to the page." | sentence/word state follows the cursor                                                                  |
| 21.4-26.3 | End card  | logomark draws, "Thoth 1.0", "Free and open source", github.com/davidawad/thoth                                                                         | ring stroke draw, rays pop, text rises                                                                  |

Notes: all text is from the sample book (public domain). No speed claim is made; 500 wpm is the app's default.
