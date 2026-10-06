// Extract a contact sheet of stills at given times: node frames.mjs <concept-dir> t1,t2,... [--v]
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [dir, ts] = process.argv.slice(2);
const vertical = process.argv.includes('--v');
const W = vertical ? 1080 : 1920,
  H = vertical ? 1920 : 1080;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto(
  pathToFileURL(resolve(dir, 'index.html')).href +
    '?render' +
    (vertical ? '&v=1' : ''),
);
await p.evaluate(() => window.__ready);
for (const t of ts.split(',').map(Number)) {
  await p.evaluate((t) => window.seek(t), t);
  await p.screenshot({
    path: `${process.env.FRAMES_OUT ?? '/tmp'}/${dir.split('/').pop()}${vertical ? '-v' : ''}-${t}.png`,
  });
}
await b.close();
