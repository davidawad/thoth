#!/usr/bin/env python3
"""Cue detection for concept 05 (real footage). Needs 05-real-app/capture/ (git-ignored raw frames,
made by capture.mjs). Detects, in SOURCE time, the playback-head word changes, the page-turn motion
envelope and the theme-switch frames by frame differencing, then maps to OUTPUT time through the SEG
table in 05-real-app/index.html. Writes audio/cues/05.json (committed, so the build needs no capture/)."""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parent.parent
cap = root / '05-real-app' / 'capture'
html = (root / '05-real-app' / 'index.html').read_text()
SEG = json.loads(re.sub(r'(?<![\d])\.(\d)', r'0.\1', re.search(r'const SEG=(\[\[.*?\]\]);', html).group(1)))  # [outStart,outEnd,srcStart,speed]
EC = float(re.search(r'EC=FADE\+([\d.]+)', html).group(1)); FADE = float(re.search(r'FADE=([\d.]+)', html).group(1))
src = (cap / 'index.js').read_text(); T = json.loads(src[src.index('=') + 1:].rstrip(';\n'))
n = len(T)
fr = np.stack([np.asarray(Image.open(cap / f'f{i:05d}.jpg').convert('L').resize((480, 270)), dtype=np.float32) for i in range(n)])
d = lambda a, b, c, e: np.abs(np.diff(fr[:, a:b, c:e], axis=0)).mean(axis=(1, 2))
glob = d(0, 270, 0, 480)
head_landing = d(35, 62, 170, 230)   # big centre word on the landing page (source space, 1920x1080 /4)
head_read = d(4, 16, 225, 270)       # playback-head word in the reading view
def to_out(s):
    for a, b, s0, v in SEG:
        s1 = s0 + (b - a) * v
        if s0 <= s < s1: return a + (s - s0) / v
    return None
steps = []
for i in range(n - 1):
    t = T[i + 1]
    if (t < 7.3 and head_landing[i] > .3) or (7.5 < t < 15 and head_read[i] > 1.0):
        o = to_out(t)
        if o is not None: steps.append(round(o, 3))
turn = []  # (outTime, motion energy) during the 0.3x page turn
for i in range(n - 1):
    t = T[i + 1]
    if 17.0 <= t <= 17.75:
        o = to_out(t)
        if o is not None: turn.append((round(o, 3), round(float(glob[i]), 3)))
clicks = []
# theme switches: global diff spikes after the page turn (src 18.8 light, 20.67 sepia, 22.5 dark), click lands ~1 frame earlier
for i in range(n - 1):
    t = T[i + 1]
    if t > 18 and (glob[i] > 1.5 or (abs(t - 20.67) < .02 and glob[i] > .5)):
        o = to_out(t)
        if o is not None: clicks.append(round(o - .03, 3))
# keyboard/mouse events inferred from capture.mjs ordering (play click, open-sample click) mapped through SEG
cues = {'steps': steps, 'turn': turn, 'themeClicks': clicks,
        'playClick': round(to_out(2.60), 3), 'openClick': round(to_out(7.45) if to_out(7.45) else 6.45, 3),
        'FADE': FADE, 'EC': FADE + EC, 'DUR': FADE + EC + 4.4, 'fps': 30}
(root / 'audio' / 'cues' / '05.json').write_text(json.dumps(cues))
print(len(steps), 'word steps;', len(turn), 'turn samples;', 'theme clicks', clicks, 'play', cues['playClick'], 'open', cues['openClick'])
