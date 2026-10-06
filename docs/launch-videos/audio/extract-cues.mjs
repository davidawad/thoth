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
  {
    id: '02',
    dir: '02-your-eyes-can-rest',
    q: '',
    expr: `({SC0,SIV,SC1,N,CO0,CO1,R0,rs,R1,BIG0,FADE,EC,DUR,lineY:pos.map(p=>p.cy),wordX:pos.map(p=>p.cx)})`,
  },
  {
    id: '03',
    dir: '03-open-the-book',
    q: '',
    expr: `({H0,H1,T0,RATE,TURN0,TURN1,TH0,FADE,EC,DUR,themeSched,n1,sentStart:sents.map((S,i)=>H0+Math.hypot(centers[i].x-cx0,centers[i].y-cy0)/900*1.6),sentHeat:sents.map(S=>S.heat),nSeq:seq.length})`,
  },
  {
    id: '04',
    dir: '04-drop-any-book',
    q: '',
    expr: `({T_DROP,T_ING0,T_ING1,T_LIB,T_LOCK,T_RES,FADE,EC,DUR})`,
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
