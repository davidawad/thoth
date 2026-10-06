// Captures the REAL running Thoth app (http://localhost:4817) via CDP screencast, then conform.sh builds a constant-fps clip.
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
const OUT = process.argv[2] ?? new URL('./capture', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1920, height: 1080 },
  colorScheme: 'dark',
  deviceScaleFactor: 1,
});
const p = await ctx.newPage();
await p.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {}
});
await p.goto('http://localhost:4817/');
await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p);
const frames = [];
const t0 = { v: null };
cdp.on('Page.screencastFrame', async (f) => {
  const ts = f.metadata.timestamp;
  if (t0.v === null) t0.v = ts;
  frames.push({ t: ts - t0.v, data: f.data });
  await cdp
    .send('Page.screencastFrameAck', { sessionId: f.sessionId })
    .catch(() => {});
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 92,
  maxWidth: 1920,
  maxHeight: 1080,
  everyNthFrame: 1,
});
const wait = (ms) => p.waitForTimeout(ms);
const mark = (n) => console.log(n, ((Date.now() - T0) / 1000).toFixed(2));
const T0 = Date.now();
mark('home');
await wait(2500);
// home: play the RSVP box
await p.getByRole('button', { name: 'Play', exact: true }).click();
mark('play');
await wait(4200);
await p
  .getByRole('button', { name: 'Play', exact: true })
  .or(p.getByRole('button', { name: /Pause/ }))
  .first()
  .click()
  .catch(() => {});
await wait(600);
// open sample book
mark('open');
await p.getByRole('button', { name: /Meditations/ }).click();
await wait(2500);
// play reading view
await p.keyboard.press('Space');
mark('read');
await wait(5000);
await p.keyboard.press('Space');
await wait(500);
// page turn forward x2
mark('turn');
await p.keyboard.press('ArrowRight');
await wait(1600);
await p.keyboard.press('ArrowRight');
await wait(1800);
// themes
mark('themes');
await p
  .getByRole('radio', { name: /^light$/i })
  .or(p.getByRole('button', { name: /^light$/i }))
  .first()
  .click()
  .catch(() => console.log('light fail'));
await wait(1800);
await p
  .getByRole('radio', { name: /^sepia$/i })
  .or(p.getByRole('button', { name: /^sepia$/i }))
  .first()
  .click()
  .catch(() => console.log('sepia fail'));
await wait(1800);
await p
  .getByRole('radio', { name: /^dark$/i })
  .or(p.getByRole('button', { name: /^dark$/i }))
  .first()
  .click()
  .catch(() => console.log('dark fail'));
await wait(1200);
mark('end');
await cdp.send('Page.stopScreencast');
writeFileSync(
  OUT + '/index.js',
  'window.CAP_T=' + JSON.stringify(frames.map((f) => +f.t.toFixed(3))) + ';',
);
frames.forEach((f, i) =>
  writeFileSync(
    `${OUT}/f${String(i).padStart(5, '0')}.jpg`,
    Buffer.from(f.data, 'base64'),
  ),
);
console.log('frames', frames.length, 'dur', frames.at(-1).t.toFixed(2));
await b.close();
