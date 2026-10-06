const M = require('../markers.cjs');
module.exports = {
  slug: 'folio-fold',
  title: 'Folio Fold',
  desc: 'The most physical one: the whole book tilts back on the desk with visible page-stack edges and deep curl shading on every turn. A dog-eared corner marks the page being read, a thin band marks the sentence, and a small reading-lamp card holds the playback head.',
  cfg: { wpp: 160 },
  pal: {
    dark: {
      paper: '#e2d3b2',
      paper2: '#c9b88f',
      ink: '#241a0f',
      'ink-dim': '#857759',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.3)',
      'hl-edge': '#7a5a1a',
      desk: '#100d0a',
      shade: 'rgba(0,0,0,.6)',
    },
    light: {
      paper: '#fbf4e0',
      paper2: '#e6dabb',
      ink: '#241a0f',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.3)',
      desk: '#cdbf99',
    },
    sepia: {
      paper: '#f6e8c3',
      paper2: '#e0cf9f',
      ink: '#3b2f1e',
      focus: '#b3261e',
      hl: 'rgba(160,110,40,.28)',
      desk: '#c3ae7c',
    },
  },
  css: `
body { background: radial-gradient(90% 70% at 50% 35%, color-mix(in srgb, var(--accent) 14%, var(--desk, var(--bg))), var(--desk, var(--bg)) 75%); overflow-x: hidden; }
.top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; font-family: var(--font-display); } .top .btn { background: var(--bg2); }
.stage { padding: 1rem 1.4rem 2rem; display: grid; justify-items: center; } .fit { --chrome: 12rem; --maxw: 1040px; perspective: 2200px; }
.tilt { transform: rotateX(9deg); transform-origin: 50% 100%; transform-style: preserve-3d; position: relative; }
.tilt::before, .tilt::after { content: ''; position: absolute; top: 1.2%; bottom: -1.4%; width: 51%; z-index: -1; background: repeating-linear-gradient(180deg, var(--paper2) 0 2px, var(--paper) 2px 4px); border-radius: 3px; }
.tilt::before { left: -.7%; transform: translateY(1.2%); box-shadow: -.3rem .8rem 1.4rem rgba(0,0,0,.45); } .tilt::after { right: -.7%; transform: translateY(1.2%); box-shadow: .3rem .8rem 1.4rem rgba(0,0,0,.45); }
.cover { position: absolute; inset: 2% -2.2% -3.4% -2.2%; background: color-mix(in srgb, var(--accent) 38%, #2a1608); border-radius: 8px; z-index: -2; box-shadow: 0 2rem 3rem rgba(0,0,0,.5); }
.pg { font-size: 1.66cqw; } .pg.L::after, .pg.R::after { z-index: 3; }
.pg.L .gutter, .pg.R .gutter { width: 9cqw; } .pg.L .gutter { background: linear-gradient(270deg, rgba(0,0,0,.34), rgba(0,0,0,.08) 55%, transparent); } .pg.R .gutter { background: linear-gradient(90deg, rgba(0,0,0,.34), rgba(0,0,0,.08) 55%, transparent); }
.pg.R::after { }
${M.corner}${M.band}
.pg.R.has-cur::after, .single .pg.has-cur::after { background: linear-gradient(135deg, var(--accent) 0 50%, color-mix(in srgb, var(--accent) 38%, #2a1608) 50% 100%); }
.pg.L.has-cur::after { background: linear-gradient(225deg, var(--accent) 0 50%, color-mix(in srgb, var(--accent) 38%, #2a1608) 50% 100%); }
.lamp { position: fixed; right: 1.2rem; top: 4.6rem; width: 15.5rem; z-index: 8; background: color-mix(in srgb, var(--bg2) 92%, #ffd27a); border: 1px solid var(--line2); border-radius: 10px; padding: .8rem; display: grid; gap: .6rem; box-shadow: 0 0 3rem color-mix(in srgb, #ffcf70 22%, transparent), 0 1rem 2rem rgba(0,0,0,.35); }
.lamp .head { font-size: 1.7rem; background: var(--bg); border-radius: 5px; padding: .4rem 0; border: 1px solid var(--line); } .lamp .row { display: flex; gap: .4rem; } .lamp .row .btn { flex: 1; padding: .45rem .3rem; }
.foot { text-align: center; padding-bottom: 1.5rem; }
@media (max-width: 960px) { .lamp { position: static; margin: 0 1.4rem 1rem; width: auto; } .tilt { transform: none; } .tilt::before, .tilt::after, .cover { display: none; } }
`,
  html: `
<div class="top"><span>Meditations</span><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="lamp" aria-label="Playback"><span class="lbl">Reading lamp</span><div class="head" data-head aria-label="Current word"></div><div class="row"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button></div></div>
<div class="stage"><div class="fit"><div class="tilt"><i class="cover"></i><div class="book"></div></div></div></div>
<p class="lbl foot"><span data-pageinfo></span> · <span data-pct></span> · <span data-left></span></p>`,
};
