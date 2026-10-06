// Regenerates the audio tracks and muxes it into a copy of each silent video (video stream is copied, never re-encoded).
// usage: node audio/build-audio.mjs [--cues] [id ...]     ids: 01 01v (default: both)
//   --cues  re-extract timeline cues from the pages first (needs playwright-core)
// Intermediates (WAV stems) go to audio/out/ which is git-ignored.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, wav } from './synth.mjs';

const here = dirname(fileURLToPath(import.meta.url)),
  root = resolve(here, '..'),
  out = resolve(here, 'out');
mkdirSync(out, { recursive: true });
const TARGETS = {
  '01': '01-one-word-at-a-time/one-word-at-a-time-16x9',
  '01v': '01-one-word-at-a-time/one-word-at-a-time-vertical-9x16',
};
const TARGET_LUFS = -16,
  CEILING = 0.794; // 0.794 = -2 dBFS sample ceiling before AAC; final true peak is verified separately
const args = process.argv.slice(2),
  ids = args.filter((a) => !a.startsWith('--')),
  wanted = ids.length ? ids : Object.keys(TARGETS);
if (args.includes('--cues'))
  execFileSync('node', [resolve(here, 'extract-cues.mjs')], {
    stdio: 'inherit',
  });
const probe = (f) =>
  Number(
    execFileSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=duration',
        '-of',
        'default=nw=1:nk=1',
        f,
      ],
      { encoding: 'utf8' },
    ),
  );
const lufs = (f) =>
  spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      f,
      '-af',
      'ebur128=peak=true',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8' },
  ).stderr;
const summary = (s) => {
  const t = s.slice(s.lastIndexOf('Summary:'));
  return {
    I: +/I:\s+(-?[\d.]+) LUFS/.exec(t)[1],
    TP: +/Peak:\s+(-?[\d.]+) dBFS/.exec(t)[1],
  };
};
const run = (a) => {
  try {
    return execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...a], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    throw new Error(String(e.stderr));
  }
};

for (const id of wanted) {
  const base = resolve(root, TARGETS[id]),
    video = base + '.mp4',
    dest = base + '-audio.mp4';
  const dur = probe(video);
  const { L, R } = render(id, dur);
  const raw = resolve(out, `${id}-raw.wav`);
  writeFileSync(raw, wav(L, R));
  // two-step loudness: measure, apply gain + safety limiter, re-measure the limited result, trim the residual
  let gain = TARGET_LUFS - summary(lufs(raw)).I,
    norm = resolve(out, `${id}-norm.wav`);
  for (let k = 0; k < 3; k++) {
    run([
      '-i',
      raw,
      '-af',
      `volume=${gain.toFixed(3)}dB,alimiter=limit=${CEILING}:attack=5:release=80:level=false`,
      '-c:a',
      'pcm_f32le',
      norm,
    ]);
    const I = summary(lufs(norm)).I;
    if (Math.abs(I - TARGET_LUFS) < 0.1) break;
    gain += TARGET_LUFS - I;
  }
  run([
    '-i',
    video,
    '-i',
    norm,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-t',
    dur.toFixed(6),
    '-movflags',
    '+faststart',
    dest,
  ]);
  const f = summary(lufs(dest));
  console.log(
    `${id}: ${dest.replace(root + '/', '')}  gain ${gain.toFixed(1)} dB  -> ${f.I} LUFS, peak ${f.TP} dBFS`,
  );
}
