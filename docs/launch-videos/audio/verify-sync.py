#!/usr/bin/env python3
"""Sync spot-check: decodes the FINAL -audio.mp4 (video frames + audio), finds frame-to-frame visual changes in a
region and audio tick onsets (1.2-4 kHz envelope peaks), and prints the nearest pairs.
usage: verify-sync.py <file> <x0,y0,x1,y1 in source px> <t0> <t1>"""
import subprocess, sys, numpy as np
f, box, t0, t1 = sys.argv[1], [int(v) for v in sys.argv[2].split(',')], float(sys.argv[3]), float(sys.argv[4])
x0, y0, x1, y1 = box
raw = subprocess.run(['ffmpeg','-v','error','-ss',str(t0),'-t',str(t1-t0),'-i',f,'-an','-vf',f'crop={x1-x0}:{y1-y0}:{x0}:{y0},scale=160:-1,format=gray','-f','rawvideo','-'],capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, int((y1-y0)/(x1-x0)*160), 160).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1,2)); vt = [t0 + (i+1)/30 for i in range(len(d)) if d[i] > 1.0]
vt = [t for k, t in enumerate(vt) if k == 0 or t - vt[k-1] > 0.05]
a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-ss',str(t0),'-t',str(t1-t0),'-i',f,'-vn','-af','highpass=f=1200,lowpass=f=4000,pan=mono|c0=0.5*c0+0.5*c1','-f','f32le','-ar','48000','-'],capture_output=True).stdout, np.float32)
w = 240; env = np.sqrt(np.convolve(a*a, np.ones(w)/w, 'same')); thr = env.max()*0.25
on = []; i = 0
while i < len(env):
    if env[i] > thr and (not on or i/48000 + t0 - on[-1] > 0.05):
        j = i
        while j+1 < len(env) and env[j+1] >= env[j]: j += 1
        on.append(t0 + (i)/48000); i = j + w
    else: i += 1
print(f'{len(vt)} visual changes, {len(on)} audio onsets in [{t0},{t1}]')
offs = []
for t in vt:
    n = min(on, key=lambda o: abs(o-t)) if on else None
    if n is not None and abs(n-t) < 0.06: offs.append(n-t)
print('matched', len(offs), 'median offset (audio - frame) ms', round(1000*float(np.median(offs)),1) if offs else None, 'max |off| ms', round(1000*max(map(abs,offs)),1) if offs else None)
for t in vt[:6]: 
    n = min(on, key=lambda o: abs(o-t)) if on else None
    print(f'  frame change {t:.3f}  nearest audio onset {n if n is None else round(n,3)}')
