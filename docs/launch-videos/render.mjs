// Frame-accurate renderer: steps window.seek(t) in a Playwright-bundled Chromium, pipes PNG-free JPEG frames to ffmpeg (H.264).
// usage: node render.mjs <concept-dir> [out.mp4] [--v]   (--v renders 1080x1920 with ?v=1)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [dir, outArg] = process.argv.slice(2);
const vertical = process.argv.includes('--v');
const W = vertical ? 1080 : 1920,
  H = vertical ? 1920 : 1080;
const out = resolve(
  outArg && !outArg.startsWith('--')
    ? outArg
    : `${dir}/${dir.split('/').pop()}${vertical ? '-vertical' : ''}.mp4`,
);
const url =
  pathToFileURL(resolve(dir, 'index.html')).href +
  '?render' +
  (vertical ? '&v=1' : '');
const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
await p.goto(url);
await p.evaluate(() => window.__ready);
const [dur, fps] = await p.evaluate(() => [window.__duration, window.__fps]);
const n = Math.round(dur * fps);
const ff = spawn(
  'ffmpeg',
  [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'image2pipe',
    '-framerate',
    String(fps),
    '-c:v',
    'mjpeg',
    '-i',
    '-',
    '-vf',
    'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-color_range',
    'tv',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-movflags',
    '+faststart',
    '-r',
    String(fps),
    out,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
for (let i = 0; i < n; i++) {
  await p.evaluate((t) => window.seek(t), i / fps);
  const buf = await p.screenshot({ type: 'jpeg', quality: 96 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0) process.stdout.write(`\r${i}/${n}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await b.close();
console.log(`\n${out}`);
