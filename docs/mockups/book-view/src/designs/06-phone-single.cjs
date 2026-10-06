const M = require('../markers.cjs');
module.exports = {
  slug: 'phone-single',
  title: 'Phone Single Page',
  desc: 'Phone-first: one page at a time with the same ideas. The leaf turns from the left edge, tap the page edges to turn, the playback head and a big play button live in the thumb zone, and contents open as a bottom sheet.',
  cfg: { forceSingle: true, wppSingle: 140 },
  pal: {
    dark: {
      paper: '#2a2119',
      paper2: '#2a2119',
      ink: '#eadfc6',
      'ink-dim': '#8d806a',
      focus: '#ff7a55',
    },
    light: {
      paper: '#fdfaf0',
      paper2: '#fdfaf0',
      ink: '#2a1e12',
      focus: '#c0261b',
    },
    sepia: {
      paper: '#f7edcf',
      paper2: '#f7edcf',
      ink: '#3b2f1e',
      focus: '#b3261e',
    },
  },
  css: `
body { background: var(--bg3); display: grid; place-items: center; min-height: 100svh; padding: 1rem; }
.phone { width: 390px; max-width: 100%; height: min(844px, calc(100svh - 2rem)); background: var(--bg); border: 1px solid var(--line2); border-radius: 34px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 2rem 3rem rgba(0,0,0,.35); }
.sbar { display: flex; align-items: center; gap: .6rem; padding: .9rem 1rem .5rem; } .sbar b { flex: 1; font-family: var(--font-display); font-weight: 500; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .sbar .btn { padding: .4rem .6rem; }
.prog { height: 3px; background: var(--line); margin: 0 1rem; } .prog i { display: block; height: 100%; width: calc(var(--p,0)*100%); background: var(--accent); }
.pagewrap { flex: 1; min-height: 0; display: grid; place-items: center; padding: .6rem .9rem; } .pagewrap { align-items: stretch; } .fit { --chrome: 20rem; --maxw: 380px; width: 100%; height: 100%; } .pagewrap .book, .pagewrap .spread, .pagewrap .spread.single { height: 100%; aspect-ratio: auto; }
.pg, .pg.R { font-size: 4.4cqw; line-height: 1.6; padding: 8cqw 8cqw 7cqw; }
${M.band}${M.corner}
.single .pg.has-cur::after { width: 13cqw; height: 13cqw; background: linear-gradient(135deg, var(--accent) 0 50%, var(--bg) 50% 100%); }
.thumb { padding: .7rem 1rem calc(.9rem + env(safe-area-inset-bottom, 0px)); background: var(--bg2); border-top: 1px solid var(--line2); display: grid; gap: .6rem; }
.thumb .head { font-size: 1.9rem; background: var(--bg); border-radius: 6px; padding: .5rem 0; border: 1px solid var(--line); }
.thumb .row { display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: .6rem; } .thumb .btn { padding: .8rem; font-size: .85rem; } .thumb .meta { display: flex; justify-content: space-between; }
.sheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: 60%; background: var(--bg2); border-top: 1px solid var(--line2); border-radius: 18px 18px 0 0; padding: 1rem; transform: translateY(105%); transition: transform .28s; z-index: 10; overflow: auto; } .sheet.open { transform: none; }
.sheet ul { list-style: none; margin: .6rem 0 0; padding: 0; display: grid; } .chbtn { width: 100%; text-align: left; display: flex; gap: .8rem; padding: .7rem .5rem; background: none; border: 0; border-bottom: 1px solid var(--line); font-family: var(--font-chrome); } .chbtn.on { color: var(--accent); } .chn { font-family: var(--font-mono); font-size: .7rem; color: var(--muted); width: 1.4rem; }
@media (max-width: 430px) { body { padding: 0; } .phone { border-radius: 0; border: 0; height: 100svh; } }
`,
  html: `
<div class="phone"><div class="sbar"><b>Meditations · Book II</b><button class="btn" type="button" data-act="toc" aria-expanded="false">Contents</button><button class="btn" type="button" data-act="theme"><span data-themename></span></button></div>
<div class="prog" data-progress><i></i></div>
<div class="pagewrap"><div class="fit s1"><div class="book"></div></div></div>
<div class="thumb"><div class="head" data-head aria-label="Current word"></div><div class="row"><button class="btn" type="button" data-act="prev" data-prev>‹ Prev</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next>Next ›</button></div><div class="meta lbl"><span data-pageinfo></span><span data-pct></span><span data-left></span></div></div>
<div class="sheet" data-toc id="toc"><span class="lbl">Contents</span><ul data-toc-list></ul></div></div>`,
};
