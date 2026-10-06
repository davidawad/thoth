const M = require('../markers.cjs');
module.exports = {
  slug: 'spotlight',
  title: 'Spotlight',
  desc: 'Focus mode: larger type, text already read and still to come recede, and only the current sentence is lit. The playback head is a slim full-width bar along the bottom edge; a hairline progress line runs across the top.',
  cfg: { wpp: 110 },
  pal: {
    dark: {
      paper: '#17130f',
      paper2: '#17130f',
      ink: '#f1e7cf',
      'ink-dim': '#857862',
      focus: '#ff6f4f',
      hl: 'transparent',
      desk: '#0e0c09',
      shade: 'rgba(0,0,0,.7)',
    },
    light: {
      paper: '#f6efdc',
      paper2: '#f6efdc',
      ink: '#1d150b',
      'ink-dim': '#b3a688',
      focus: '#c0261b',
      hl: 'transparent',
      desk: '#e2d6b6',
    },
    sepia: {
      paper: '#f2e6c6',
      paper2: '#f2e6c6',
      ink: '#33281a',
      'ink-dim': '#b9a67c',
      focus: '#b3261e',
      hl: 'transparent',
      desk: '#d8c797',
    },
  },
  css: `
body { background: var(--desk); padding-bottom: 5.2rem; }
.hair { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: var(--line); z-index: 9; } .hair i { display: block; height: 100%; width: calc(var(--p,0)*100%); background: var(--accent); }
.top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.6rem; color: var(--muted); font-family: var(--font-mono); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; } .top .btn { background: none; }
.stage { padding: 0 1.4rem; display: grid; justify-items: center; } .fit { --chrome: 12rem; --maxw: 1100px; }
.pg, .pg.L, .pg.R { background: var(--paper); font-family: var(--font-chrome); font-size: 1.95cqw; line-height: 1.62; padding: 6cqw 6.4cqw 5cqw; }
.pg .txt p { text-indent: 0; margin-bottom: .75em; } .pg .gutter { display: none; } .pg.L { border-right: 1px solid var(--line); }
.pg .rh, .pg .folio { opacity: .8; }
${M.spotlight}
.w.cur { background: none; box-shadow: none; color: var(--ink); font-weight: 600; text-shadow: 0 0 .6em color-mix(in srgb, var(--focus) 45%, transparent); }
.w.in-s { color: var(--ink); }
.bottom { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; padding: .7rem 1.6rem calc(.7rem + env(safe-area-inset-bottom, 0px)); background: var(--bg2); border-top: 1px solid var(--line2); }
.bottom .head { font-size: 1.9rem; min-width: 14rem; } .bottom .l, .bottom .r { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; } .bottom .r { justify-content: flex-end; }
@media (max-width: 760px) { .bottom { grid-template-columns: 1fr; padding: .6rem 1rem; } .bottom .l, .bottom .r { justify-content: center; } body { padding-bottom: 9rem; } .pg, .pg.R { font-size: 4.9cqw; } }
`,
  html: `
<div class="hair" data-progress><i></i></div>
<div class="top"><span>Meditations · The Second Book</span><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="stage"><div class="fit"><div class="book"></div></div></div>
<div class="bottom"><div class="l"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹ Prev</button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">Next ›</button></div><div class="head" data-head aria-label="Current word"></div><div class="r"><span class="lbl" data-pageinfo></span><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button></div></div>`,
};
