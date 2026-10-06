const M = require('../markers.cjs');
module.exports = {
  slug: 'typeset',
  title: 'Typeset',
  desc: 'Editorial typesetting: drop cap, small-caps opening, running heads and folios. The playback head is a header strip across the top, a chapter rail runs down the left edge, and the current page gets a folded corner plus a highlighter band.',
  cfg: { wpp: 172, runHeads: ['MARCUS AURELIUS', 'MEDITATIONS · BOOK II'] },
  pal: {
    dark: {
      paper: '#e8e0cc',
      paper2: '#d6ccb2',
      ink: '#1f1810',
      'ink-dim': '#7c705c',
      focus: '#c0261b',
      hl: 'rgba(180,144,63,.34)',
      'hl-edge': '#7a5a1a',
      desk: '#1b1712',
    },
    light: {
      paper: '#fffdf6',
      paper2: '#efe8d4',
      ink: '#1f1810',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.3)',
    },
    sepia: {
      paper: '#f8efd4',
      paper2: '#e9dcb6',
      ink: '#3b2f1e',
      focus: '#b3261e',
      hl: 'rgba(160,110,40,.28)',
    },
  },
  css: `
.strip { position: sticky; top: 0; z-index: 8; display: grid; grid-template-columns: 1fr minmax(14rem, 24rem) 1fr; align-items: center; gap: 1rem; padding: .7rem 1.4rem; background: var(--bg2); border-bottom: 1px solid var(--line2); }
.strip .head { font-size: 2.1rem; justify-self: stretch; } .strip .l { display: flex; gap: .7rem; align-items: baseline; } .strip .l b { font-family: var(--font-display); font-weight: 500; } .strip .r { display: flex; gap: .6rem; justify-content: flex-end; align-items: center; flex-wrap: wrap; }
.main { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: 1rem; padding: 1.4rem 1.4rem 2rem; align-items: start; }
.rail { position: sticky; top: 5.5rem; display: grid; gap: .55rem; justify-items: center; padding-top: .6rem; } .rail .tick { width: .9rem; height: 2px; background: var(--line2); display: block; } .rail .tick.on { width: 1.6rem; height: 3px; background: var(--accent); }
.rail::before { content: 'BOOKS'; font-family: var(--font-mono); font-size: .56rem; letter-spacing: .14em; color: var(--muted); writing-mode: vertical-rl; margin-bottom: .6rem; }
.fit { --chrome: 11rem; }
.pg { font-size: 1.66cqw; line-height: 1.6; text-align: justify; }
.pg .txt p { text-align: justify; hyphens: auto; }
.pg .txt p.first::first-letter { font-family: var(--font-display); font-weight: 600; font-size: 4.1em; float: left; line-height: .78; padding: .05em .09em 0 0; color: var(--ink); }
.pg .txt p.first::first-line { font-variant: small-caps; letter-spacing: .05em; }
.pg .rh { font-family: var(--font-chrome); font-style: italic; letter-spacing: .02em; text-transform: none; font-size: .78em; border-bottom: 0; } .pg .folio { font-family: var(--font-display); font-size: .8em; }
.book { filter: drop-shadow(0 1.6rem 1.4rem rgba(0,0,0,.35)); }
${M.band}${M.corner}
@media (max-width: 760px) { .strip { grid-template-columns: 1fr; } .strip .r, .strip .l { justify-content: space-between; } .main { grid-template-columns: 1fr; padding: 1rem; } .rail { display: none; } }
`,
  html: `
<header class="strip"><div class="l"><b>Meditations</b><span class="lbl" data-chapinfo></span></div><div class="head" data-head aria-label="Current word"></div>
 <div class="r"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button><button class="btn" type="button" data-act="theme"><span data-themename></span></button></div></header>
<div class="main"><div class="rail" data-rail aria-hidden="true"></div><div><div class="fit"><div class="book"></div></div><p class="lbl" style="text-align:center;margin:1.2rem 0 0"><span data-pageinfo></span> · <span data-pct></span> · <span data-left></span></p></div></div>`,
};
