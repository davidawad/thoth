/* 08 Spotlight, revised: playback head up in the top nav, settings widget docked on the bottom row,
   and a mock landing screen (#landing) that the reader is reached from (#read, the default). */
const fs = require('fs'),
  path = require('path');
const M = require('../markers.cjs');
const here = __dirname;
const text = JSON.parse(
  fs.readFileSync(path.join(here, '..', 'text.json'), 'utf8'),
);
const N = text.paras.reduce((n, p) => n + p.split(/\s+/).length, 0);

/* real Thoth palette tokens, parsed from the app source so the mockup can never drift from it */
const ts = fs.readFileSync(
  path.join(here, '../../../../../src/components/palette/palettes.ts'),
  'utf8',
);
const PALS = ['archive', 'slate', 'sage', 'rose', 'high-contrast'];
const tokens = (blk) => {
  const o = {};
  for (const m of blk.matchAll(/'(--color-[a-z0-9-]+)':\s*'([^']+)'/g))
    o[m[1]] = m[2];
  return o;
};
const half = (blk, k) => {
  const i = blk.indexOf(`${k}: {`);
  return tokens(blk.slice(i, blk.indexOf('},', i)));
};
const pal = {};
PALS.forEach((k) => {
  const start = ts.search(new RegExp(`\\n  '?${k}'?: \\{`));
  const end = ts.indexOf('\n  },', start);
  const blk = ts.slice(start, end);
  pal[k] = { dark: half(blk, 'dark'), light: half(blk, 'light') };
});
const vars = (o) =>
  Object.entries(o)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
const palCss =
  PALS.map((k) => {
    const d = `:root[data-pal='${k}'][data-theme='dark'] { ${vars(pal[k].dark)} }`;
    const l = `:root[data-pal='${k}'][data-theme='light'], :root[data-pal='${k}'][data-theme='sepia'] { ${vars(pal[k].light)} }`;
    return `${d}\n${l}`;
  }).join('\n') +
  '\n' +
  ['dark', 'light']
    .map(
      (m) =>
        `:root[data-theme='${m}']${m === 'light' ? ", :root[data-theme='sepia']" : ''} { ${PALS.map(
          (k) =>
            `--sw-${k}-1: ${pal[k][m]['--color-bg']}; --sw-${k}-2: ${pal[k][m]['--color-accent']};`,
        ).join(' ')} }`,
    )
    .join('\n');

const label = {
  archive: 'Archive',
  slate: 'Slate',
  sage: 'Sage',
  rose: 'Rose',
  'high-contrast': 'High contrast',
};
const swatches = PALS.map(
  (k) =>
    `<button type="button" role="radio" aria-checked="false" data-v="${k}" title="${label[k]}" aria-label="${label[k]}" style="--c1: var(--sw-${k}-1); --c2: var(--sw-${k}-2)"></button>`,
).join('');

const ic = {
  prev: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h2v14H7zM20 5v14L10 12z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5h2v14h-2zM4 5l10 7L4 19z" fill="currentColor"/></svg>',
  play: '<svg class="i-play" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 4.5v15L19 12z" fill="currentColor"/></svg><svg class="i-pause" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" fill="currentColor"/></svg>',
  toc: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  sliders:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  pgprev:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pgnext:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const sampleText =
  'Remember how long thou hast already put off these things, and how often a certain day and hour, having been set unto thee by the gods, thou hast neglected it. It is high time for thee to understand the true nature of the world.';

module.exports = {
  num: '08',
  shot: '08-v2.png',
  slug: 'spotlight-v2',
  title: 'Spotlight',
  badge: 'chosen direction, revised',
  desc: 'Spotlight, revised after review: the playback head moves up into the top nav above the book (word with its red focus letter, prev / play / next, wpm), and a slim always-visible settings row sits on the bottom (speed, text size, theme, five palettes, spotlight dim, contents, progress). Collapses to a bottom sheet on phones. Open #landing to see the entry screen the reader is reached from.',
  cfg: { wpp: 110, wppSingle: 96, startWord: Math.round(0.27 * (N - 1)) },
  patchEngine: (e) =>
    e.replace(
      'window.__book = {',
      `window.__book = {
      cfg: C,
      words: N,
      spreadOf: spreadOfWord,
      getRate: function () { return rate; },
      setRate: function (r) { rate = r; info(); },
      goto: function (i) { play(false); show(spreadOfWord(i)); setCur(i); },
      reflow: function () { var w = ci; layout(); show(spreadOfWord(w)); setCur(w); },
      theme: theme,`,
    ),
  head: `<script>(function(){var d=document.documentElement,s={};try{s=JSON.parse(localStorage.getItem('bv2')||'{}')}catch(e){}
d.dataset.pal=s.pal||'archive';d.dataset.dim=s.dim||'full';if(s.ts)d.style.setProperty('--ts',s.ts);
try{var t=localStorage.getItem('bv-theme');if(t)d.dataset.theme=t}catch(e){}
d.dataset.route=/landing/.test(location.hash)?'landing':'read';})();</script>`,
  js: fs.readFileSync(path.join(here, '11-spotlight-v2.client.js'), 'utf8'),
  css: `
/* ---- tokens: Thoth palette (real values) mapped onto the mockup tokens ---- */
${palCss}
:root { --sepia-tint: #d6bc83; --dock-h: 4.6rem; --ts: 1; }
:root[data-pal] {
  --bg: var(--color-bg); --bg2: var(--color-bg-elevated); --bg3: var(--color-bg-elevated-2);
  --fg: var(--color-fg); --muted: var(--color-fg-muted); --line: var(--color-border); --line2: var(--color-border-strong);
  --accent: var(--color-accent); --accent-ink: var(--color-accent-contrast); --ring: var(--color-focus-ring);
  --paper: var(--color-surface-highlight); --ink: var(--color-surface-highlight-fg);
  --paper2: color-mix(in srgb, var(--paper) 90%, var(--ink));
  --focus: var(--color-error);
  --desk: color-mix(in srgb, var(--bg) 84%, black);
  --hl-edge: var(--accent);
}
:root[data-pal][data-theme='sepia'] {
  --bg: color-mix(in srgb, var(--color-bg) 58%, var(--sepia-tint));
  --bg2: color-mix(in srgb, var(--color-bg-elevated) 58%, var(--sepia-tint));
  --bg3: color-mix(in srgb, var(--color-bg-elevated-2) 58%, var(--sepia-tint));
  --paper: color-mix(in srgb, var(--color-surface-highlight) 52%, var(--sepia-tint));
  --desk: color-mix(in srgb, var(--bg) 82%, black);
}
:root { --dimmed: color-mix(in srgb, var(--ink) 34%, var(--paper)); }
:root[data-dim='soft'] { --dimmed: color-mix(in srgb, var(--ink) 62%, var(--paper)); }
:root[data-dim='off'] { --dimmed: var(--ink); }

/* ---- routing ---- */
#landing { display: none; }
:root[data-route='landing'] #landing { display: block; }
:root[data-route='landing'] #reader { display: none; }
body { background: var(--bg); }
.app { min-height: 100svh; display: flex; flex-direction: column; background: var(--desk); }

/* ---- top nav with the playback head ---- */
.hair { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: var(--line); z-index: 40; } .hair i { display: block; height: 100%; width: calc(var(--p,0)*100%); background: var(--accent); }
.nav { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; padding: .7rem 1.4rem; background: var(--bg2); border-bottom: 1px solid var(--line2); }
.nav-l { display: flex; align-items: baseline; gap: .9rem; min-width: 0; }
.back { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); text-decoration: none; white-space: nowrap; padding: .35rem 0; }
.back:hover { color: var(--fg); text-decoration: underline; }
.ttl { font-family: var(--font-display); font-size: 1rem; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ttl i { color: var(--muted); font-style: normal; }
.nav-r { text-align: right; }
.strip { display: flex; align-items: center; gap: .5rem; padding: .3rem .5rem .3rem .4rem; border: 1px solid var(--line2); border-radius: 999px; background: var(--bg); }
.ib { display: inline-grid; place-items: center; min-width: 2.2rem; height: 2.2rem; padding: 0 .5rem; border: 1px solid transparent; background: none; border-radius: 999px; color: var(--fg); gap: .4rem; font-family: var(--font-mono); font-size: .75rem; }
.ib:hover:not(:disabled) { background: var(--bg3); } .ib:disabled { opacity: .35; cursor: default; }
.ib.play { background: var(--accent); color: var(--accent-ink); width: 2.7rem; height: 2.7rem; padding: 0; } .ib.play:hover { background: var(--accent); filter: brightness(1.1); }
.ib.play [data-playlabel] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.i-pause { display: none; } body.playing .i-pause { display: block; } body.playing .i-play { display: none; }
.strip .head { width: 15rem; font-size: 1.6rem; padding: 0 .2rem; border-left: 1px solid var(--line); border-right: 1px solid var(--line); color: var(--fg); }
.strip .wpm { font-family: var(--font-mono); font-size: .72rem; color: var(--muted); min-width: 4.6rem; text-align: center; }

/* ---- the book ---- */
.stage { flex: 1; display: grid; align-content: center; justify-items: center; padding: 1.2rem 1.4rem 1.2rem; }
.fit { --chrome: 12.5rem; --maxw: 1100px; width: min(var(--maxw), 100%, calc((100svh - var(--chrome)) * 1.42)); }
.fit.s1 { width: min(480px, 100%, calc((100svh - var(--chrome)) * .68)); }
.spread .pg, .spread .pg.L, .spread .pg.R { background: var(--paper); font-family: var(--font-chrome); font-size: calc(1.95cqw * var(--ts)); line-height: 1.62; padding: 6cqw 6.4cqw 5cqw; }
.spread.single .pg, .spread.single .pg.R { font-size: calc(4.9cqw * var(--ts)); }
.spread .pg.L { background: linear-gradient(90deg, var(--paper) 80%, var(--paper2)); border-right: 1px solid var(--line); }
.spread .pg.R { background: linear-gradient(270deg, var(--paper) 80%, var(--paper2)); }
.spread.single .pg.R { background: var(--paper); }
.pg .txt p { text-indent: 0; margin-bottom: .75em; } .pg .gutter { display: none; }
.pg .rh, .pg .folio { opacity: .85; }
.w { color: var(--dimmed); transition: color .25s; }
.w.in-s, .w.cur { color: var(--ink); }
:root[data-dim='off'] .w.in-s { background: color-mix(in srgb, var(--accent) 16%, transparent); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.w.cur { font-weight: inherit; background: color-mix(in srgb, var(--focus) 17%, transparent); box-shadow: 0 0 0 .14em color-mix(in srgb, var(--focus) 17%, transparent); border-bottom: 0; }
.w .f { color: var(--focus); font-weight: inherit; text-decoration: underline; text-decoration-thickness: .09em; text-underline-offset: .16em; }
${M.ribbon}

/* ---- dock: settings row ---- */
.dock { position: sticky; bottom: 0; z-index: 30; background: var(--bg2); border-top: 1px solid var(--line2); padding: .5rem 1.2rem calc(.5rem + env(safe-area-inset-bottom, 0px)); }
.compact { display: none; }
.settings { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: center; gap: .45rem 1.4rem; }
.sheet-h { display: none; }
.ctl { display: flex; flex-direction: column; gap: .22rem; min-width: 0; }
.ctl > .lbl { font-size: .56rem; }
.ctl .row { display: flex; align-items: center; gap: .55rem; min-height: 2rem; }
.settings .btn { padding: .4rem .6rem; font-size: .72rem; height: 2rem; display: inline-flex; align-items: center; gap: .4rem; }
.settings .btn:disabled { opacity: .35; cursor: default; }
.seg { display: inline-flex; border: 1px solid var(--line2); border-radius: 4px; overflow: hidden; height: 2rem; }
.seg button { border: 0; background: none; padding: 0 .65rem; font-family: var(--font-mono); font-size: .72rem; } .seg button + button { border-left: 1px solid var(--line2); }
.seg button:hover { background: var(--bg3); } .seg button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); }
.sw { display: flex; gap: .45rem; align-items: center; height: 2rem; }
.sw button { width: 1.45rem; height: 1.45rem; padding: 0; border-radius: 50%; border: 1px solid var(--line2); background: linear-gradient(135deg, var(--c1) 50%, var(--c2) 50%); }
.sw button[aria-checked='true'] { outline: 2px solid var(--ring); outline-offset: 2px; }
#speed { width: 8.5rem; accent-color: var(--accent); height: 1.4rem; }
.ctl output, .ctl .val { font-family: var(--font-mono); font-size: .72rem; color: var(--muted); min-width: 4.2rem; }
.prog { margin-left: auto; }
.prog .pr { font-family: var(--font-mono); font-size: .74rem; white-space: nowrap; color: var(--fg); } .prog [data-pageinfo] { text-transform: lowercase; letter-spacing: 0; color: var(--fg); font-size: .74rem; }
.prog .ib { min-width: 1.9rem; height: 1.9rem; border-color: var(--line2); }

/* ---- contents drawer ---- */
.toc { position: fixed; z-index: 60; top: 0; bottom: 0; left: 0; width: min(23rem, 88vw); background: var(--bg2); border-right: 1px solid var(--line2); box-shadow: 0 0 2rem var(--shade); padding: 1.2rem 1.2rem 1rem; display: flex; flex-direction: column; transform: translateX(-102%); visibility: hidden; transition: transform .28s ease, visibility 0s .28s; }
.toc.open { transform: none; visibility: visible; transition: transform .28s ease; }
.toc h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.3rem; margin: 0; } .toc header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .6rem; }
.toc .note { font-family: var(--font-mono); font-size: .66rem; color: var(--muted); margin: 0 0 .8rem; line-height: 1.4; }
.toc ol { list-style: none; margin: 0; padding: 0; overflow: auto; flex: 1; }
.toc li button { width: 100%; display: grid; grid-template-columns: 1.8rem 1fr auto; gap: .6rem; align-items: baseline; text-align: left; padding: .6rem .5rem; background: none; border: 0; border-bottom: 1px solid var(--line); color: var(--fg); font-family: var(--font-chrome); font-size: 1.05rem; }
.toc li button:hover { background: var(--bg3); } .toc li button[aria-current] { box-shadow: inset 3px 0 0 var(--accent); background: var(--bg3); }
.toc .n, .toc .pgn { font-family: var(--font-mono); font-size: .7rem; color: var(--muted); }
.tocscrim { position: fixed; inset: 0; z-index: 55; background: color-mix(in srgb, black 45%, transparent); opacity: 0; pointer-events: none; transition: opacity .25s; }
body.toc-open .tocscrim { opacity: 1; pointer-events: auto; }

/* ---- landing (stand-in for the existing Thoth page) ---- */
#landing { background: var(--bg); color: var(--fg); min-height: 100svh; }
.ld-top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.6rem; border-bottom: 1px solid var(--line); }
.ld-brand { font-family: var(--font-display); font-size: 1.5rem; font-weight: 500; letter-spacing: .02em; } .ld-brand i { color: var(--accent); font-style: normal; }
.ld-top nav { display: flex; gap: .8rem; align-items: center; font-family: var(--font-mono); font-size: .75rem; color: var(--muted); }
.ld-grid { display: grid; grid-template-columns: minmax(0, 1fr) 21rem; gap: 1.6rem; max-width: 74rem; margin: 0 auto; padding: 2rem 1.6rem 3rem; }
.ld-main { display: flex; flex-direction: column; gap: 1.4rem; min-width: 0; }
.ld-rsvp { border: 1px solid var(--line2); border-radius: 6px; background: var(--bg2); padding: 2.6rem 1rem 1.4rem; display: grid; justify-items: center; gap: 1.6rem; }
.ld-rsvp .head { width: min(30rem, 100%); font-size: clamp(2.2rem, 6vw, 3.4rem); color: var(--fg); position: relative; }
.ld-rsvp .head::before, .ld-rsvp .head::after { content: ''; position: absolute; left: 50%; width: 1px; height: .6rem; background: var(--line2); }
.ld-rsvp .head::before { top: -.9rem; } .ld-rsvp .head::after { bottom: -.9rem; }
.ld-ctl { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: center; }
.ld-ctl .btn { min-width: 5.5rem; padding: .6rem 1rem; font-size: .85rem; }
.ld-main label { font-family: var(--font-mono); font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: .4rem; }
.ld-main textarea { width: 100%; min-height: 9rem; resize: vertical; background: var(--bg2); color: var(--fg); border: 1px solid var(--line2); border-radius: 6px; padding: .9rem 1rem; font-family: var(--font-chrome); font-size: 1.05rem; line-height: 1.55; }
.ld-side { display: flex; flex-direction: column; gap: 1.1rem; }
.card2 { border: 1px solid var(--line2); border-radius: 6px; background: var(--bg2); padding: 1rem 1.1rem; }
.card2 h3 { font-family: var(--font-display); font-weight: 500; font-size: 1.05rem; margin: 0 0 .7rem; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem 1rem; margin: 0; } .stats dt { font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); } .stats dd { margin: .1rem 0 0; font-family: var(--font-display); font-size: 1.5rem; }
.drop { border: 2px dashed var(--line2); border-radius: 6px; padding: 1.6rem 1rem; text-align: center; color: var(--muted); font-size: 1rem; background: transparent; }
.drop.over { border-color: var(--accent); background: var(--bg2); color: var(--fg); } .drop b { color: var(--fg); font-weight: 500; } .drop small { display: block; font-family: var(--font-mono); font-size: .66rem; margin-top: .4rem; }
.cont .bk { display: flex; gap: .8rem; align-items: center; }
.cover { width: 3.1rem; height: 4.3rem; border-radius: 2px 4px 4px 2px; background: var(--accent); color: var(--accent-ink); font-family: var(--font-display); font-size: .5rem; display: grid; place-items: center; text-align: center; letter-spacing: .08em; flex: none; }
.cont h3 { margin: 0; } .cont p { margin: .1rem 0 0; color: var(--muted); font-size: .92rem; }
.bar2 { height: 4px; background: var(--line); border-radius: 2px; margin: .9rem 0; overflow: hidden; } .bar2 i { display: block; height: 100%; width: 27%; background: var(--accent); }
.cont .btn { width: 100%; text-align: center; text-decoration: none; display: block; padding: .6rem; font-size: .85rem; }
.ld-note { max-width: 74rem; margin: 0 auto; padding: 0 1.6rem 2rem; font-family: var(--font-mono); font-size: .66rem; color: var(--muted); }
@media (max-width: 900px) { .ld-grid { grid-template-columns: 1fr; } }

/* ---- narrow: single page, compact dock row + bottom sheet ---- */
@media (max-width: 759px) {
  .nav { grid-template-columns: 1fr; gap: .5rem; padding: .55rem .9rem .6rem; }
  .nav-r { display: none; }
  .nav-l { min-width: 0; gap: .6rem; } .ttl { min-width: 0; font-size: .9rem; }
  .strip { justify-self: center; max-width: 100%; gap: .1rem; padding: .25rem .4rem .25rem .25rem; } .strip .head { width: 6.4rem; font-size: 1.25rem; } .strip .wpm { min-width: 3.3rem; font-size: .62rem; }
  .strip .ib { min-width: 2.2rem; height: 2.2rem; padding: 0 .3rem; } .strip .ib.play { width: 2.6rem; height: 2.6rem; }
  .stage { padding: .8rem .9rem .8rem; } .fit { --chrome: 12.8rem; }
  .compact { display: flex; align-items: center; gap: .3rem; }
  .compact .sp { flex: 1; text-align: center; font-family: var(--font-mono); font-size: .72rem; white-space: nowrap; } .compact [data-pageinfo] { text-transform: lowercase; letter-spacing: 0; font-size: .72rem; color: var(--fg); }
  .compact .ib { border-color: var(--line2); min-width: 2.6rem; height: 2.6rem; } .compact .ib[aria-expanded='true'] { background: var(--accent); color: var(--accent-ink); }
  .dock { padding: .4rem .7rem calc(.4rem + env(safe-area-inset-bottom, 0px)); }
  .settings { position: fixed; left: 0; right: 0; bottom: var(--dock-h); max-height: 64svh; overflow: auto; flex-wrap: nowrap; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: .1rem; background: var(--bg2); border-top: 1px solid var(--line2); box-shadow: 0 -.6rem 1.4rem var(--shade); padding: .5rem 1rem 1rem; transform: translateY(calc(100% + var(--dock-h))); visibility: hidden; transition: transform .26s ease, visibility 0s .26s; border-radius: 14px 14px 0 0; }
  .dock.open .settings { transform: none; visibility: visible; transition: transform .26s ease; }
  .sheet-h { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-display); font-size: 1.1rem; padding: .2rem 0 .4rem; } .sheet-h::before { content: ''; position: absolute; top: .35rem; left: 50%; width: 2.4rem; height: 4px; margin-left: -1.2rem; background: var(--line2); border-radius: 2px; }
  .ctl { flex-direction: row; justify-content: space-between; align-items: center; padding: .45rem 0; border-top: 1px solid var(--line); } .ctl > .lbl { font-size: .62rem; }
  .ctl .row { justify-content: flex-end; flex: 1; } #speed { width: 100%; max-width: 12rem; }
  .prog { margin-left: 0; display: none; }
  .tocctl { display: none; }
  .tocscrim { z-index: 55; }
}
@media (min-width: 760px) { .sheet-only { display: none; } }
`,
  html: `
<div id="reader" class="app">
<div class="hair" data-progress><i></i></div>
<header class="nav">
  <div class="nav-l"><a class="back" href="#landing">‹ Back to landing</a><span class="ttl">Meditations <i>·</i> <span data-chapinfo></span></span></div>
  <div class="strip" role="group" aria-label="Playback head">
    <button class="ib" type="button" data-v2="wprev" aria-label="Previous word">${ic.prev}</button>
    <button class="ib play" type="button" data-act="play" aria-label="Play or pause (space)">${ic.play}<span data-playlabel>Play</span></button>
    <button class="ib" type="button" data-v2="wnext" aria-label="Next word">${ic.next}</button>
    <div class="head" data-head role="status" aria-label="Current word"></div>
    <span class="wpm" data-rate aria-label="Reading speed"></span>
  </div>
  <div class="nav-r"><span class="lbl" data-wordpos></span></div>
</header>
<div class="stage"><div class="fit"><div class="book"></div></div></div>
<footer class="dock" id="dock">
  <div class="compact">
    <button class="ib" type="button" data-v2="toc" aria-label="Contents" aria-expanded="false" aria-controls="toc">${ic.toc}</button>
    <button class="ib" type="button" data-v2="sheet" aria-label="Reading settings" aria-expanded="false" aria-controls="settings">${ic.sliders}</button>
    <span class="sp"><span data-pageinfo></span> · <span data-pct></span></span>
    <button class="ib" type="button" data-act="prev" data-prev aria-label="Previous page">${ic.pgprev}</button>
    <button class="ib" type="button" data-act="next" data-next aria-label="Next page">${ic.pgnext}</button>
  </div>
  <div class="settings" id="settings" role="group" aria-label="Reading settings">
    <div class="sheet-h"><span>Reading settings</span><button class="btn" type="button" data-v2="sheetclose">Done</button></div>
    <div class="ctl"><label class="lbl" for="speed">Speed</label><div class="row"><input id="speed" type="range" min="120" max="700" step="10" value="260"><output data-rate for="speed"></output></div></div>
    <div class="ctl"><span class="lbl" id="l-size">Text size</span><div class="row" role="group" aria-labelledby="l-size"><button class="btn" type="button" data-act2="smaller" aria-label="Smaller text">A−</button><button class="btn" type="button" data-act2="larger" aria-label="Larger text">A+</button><span class="val" data-sizename style="min-width:2.6rem"></span></div></div>
    <div class="ctl"><span class="lbl" id="l-theme">Theme</span><div class="seg" data-seg="theme" role="group" aria-labelledby="l-theme"><button type="button" data-v="dark" aria-pressed="false">dark</button><button type="button" data-v="light" aria-pressed="false">light</button><button type="button" data-v="sepia" aria-pressed="false">sepia</button></div></div>
    <div class="ctl"><span class="lbl" id="l-pal">Palette <span data-palname style="text-transform:none;letter-spacing:0"></span></span><div class="sw" role="radiogroup" aria-labelledby="l-pal">${swatches}</div></div>
    <div class="ctl"><span class="lbl" id="l-dim">Spotlight dim</span><div class="seg" data-seg="dim" role="group" aria-labelledby="l-dim"><button type="button" data-v="full" aria-pressed="false">full</button><button type="button" data-v="soft" aria-pressed="false">soft</button><button type="button" data-v="off" aria-pressed="false">off</button></div></div>
    <div class="ctl tocctl"><span class="lbl">Book</span><button class="btn toc-in-sheet" type="button" data-v2="toc" aria-expanded="false" aria-controls="toc">${ic.toc} Contents</button></div>
    <div class="ctl prog"><span class="lbl">Progress</span><div class="row"><button class="ib" type="button" data-act="prev" data-prev aria-label="Previous page">${ic.pgprev}</button><span class="pr"><span data-pageinfo></span> · <span data-pct></span> · <span data-left></span></span><button class="ib" type="button" data-act="next" data-next aria-label="Next page">${ic.pgnext}</button></div></div>
  </div>
</footer>
<div class="tocscrim" data-v2="tocclose" aria-hidden="true"></div>
<aside class="toc" id="toc" aria-label="Contents">
  <header><h2>Contents</h2><button class="btn" id="toc-close" type="button" data-v2="tocclose">Close</button></header>
  <p class="note">Mock chapter list. Only one book of text is bundled here, so a chapter jumps to the matching place in it.</p>
  <ol id="toc-list"></ol>
</aside>
</div>

<main id="landing" aria-label="Thoth landing (mock)">
  <div class="ld-top"><span class="ld-brand">Thoth<i>.</i></span><nav><span>Library</span><span>Settings</span><span>Theme: <span data-themename></span></span></nav></div>
  <div class="ld-grid">
    <div class="ld-main">
      <section class="ld-rsvp" aria-label="RSVP reader"><div class="head" id="ld-word" aria-live="off"></div>
        <div class="ld-ctl"><button class="btn pri" type="button" id="ld-play" data-demo="play">Play</button><button class="btn" type="button" data-demo="reset">Reset</button></div></section>
      <div><label for="ld-text">Text to read</label><textarea id="ld-text" spellcheck="false">${sampleText}</textarea></div>
    </div>
    <aside class="ld-side">
      <section class="card2"><h3>Your stats</h3><dl class="stats"><div><dt>Words read</dt><dd>48,210</dd></div><div><dt>Avg speed</dt><dd>312 wpm</dd></div><div><dt>Streak</dt><dd>9 days</dd></div><div><dt>Today</dt><dd>24 min</dd></div></dl></section>
      <section class="drop" id="ld-drop" aria-label="Drop zone"><b>Drop a book or text file</b><small id="ld-dropmsg">EPUB, TXT or paste above</small></section>
      <section class="card2 cont"><div class="bk"><div class="cover" aria-hidden="true">MEDI<br>TATIONS</div><div><h3>Continue reading</h3><p>Meditations · 27%</p></div></div><div class="bar2" aria-hidden="true"><i></i></div><a class="btn pri" href="#read">Open</a></section>
    </aside>
  </div>
  <p class="ld-note">Mock of the existing landing page. The reading view is a separate screen reached with Open.</p>
</main>`,
};
