// Reads the real timeline constants out of each concept page (headless Chromium, same as render.mjs)
// and writes audio/cues/<id>.json. Cue times are therefore exact, not hand-transcribed.
// usage: node audio/extract-cues.mjs   (05 comes from detect-05.py, which analyses the captured footage)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'audio/cues');
mkdirSync(out, { recursive: true });

const JOBS = [
  {
    id: '01',
    dir: '01-one-word-at-a-time',
    q: '',
    expr: `({st,P1,P1END,TR0,TR1,P2,P2IV,P2END,FADE,EC,DUR,N,words,iv:st.map((_,i)=>iv(i))})`,
  },
  {
    id: '01v',
    dir: '01-one-word-at-a-time',
    q: '&v=1',
    vertical: true,
    expr: `({st,P1,P1END,TR0,TR1,P2,P2IV,P2END,FADE,EC,DUR,N,words,iv:st.map((_,i)=>iv(i))})`,
  },
];
const b = await chromium.launch();
for (const j of JOBS) {
  const W = j.vertical ? 1080 : 1920,
    H = j.vertical ? 1920 : 1080;
  const p = await b.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  await p.goto(
    pathToFileURL(resolve(root, j.dir, 'index.html')).href + '?render' + j.q,
  );
  await p.evaluate(() => window.__ready);
  const data = await p.evaluate(j.expr);
  data.fps = await p.evaluate(() => window.__fps);
  writeFileSync(resolve(out, `${j.id}.json`), JSON.stringify(data));
  console.log(j.id, 'DUR', data.DUR.toFixed(3), 'EC', data.EC.toFixed(3));
  await p.close();
}
await b.close();
