const M = require('../markers.cjs');
module.exports = {
  slug: 'vellum-night',
  title: 'Vellum Night',
  desc: 'Dark vellum pages for evening reading. A gold margin tick and a quiet underline follow the sentence; the playback head is a floating pill hung under the gutter; contents slide in from the left.',
  cfg: { wpp: 185, runRight: 'MARCUS AURELIUS' },
  pal: {
    dark: {
      paper: '#2b241b',
      paper2: '#221c14',
      ink: '#eadfc6',
      'ink-dim': '#8f8168',
      focus: '#ff7a55',
      'hl-edge': '#d8b45c',
    },
    light: {
      paper: '#f6edd6',
      paper2: '#e9dcbb',
      ink: '#2a1e12',
      focus: '#c0261b',
      'hl-edge': '#7a5a1a',
    },
    sepia: {
      paper: '#f0e2bf',
      paper2: '#e2d1a5',
      ink: '#3b2f1e',
      focus: '#b3261e',
      'hl-edge': '#8a5a2b',
    },
  },
  css: `
body { background: radial-gradient(110% 80% at 50% 30%, var(--bg2), color-mix(in srgb, var(--bg) 70%, #000) 75%); min-height: 100svh; }
.bar { display: flex; align-items: center; gap: .8rem; padding: .9rem 1.4rem; }
.bar h1 { font-family: var(--font-display); font-weight: 500; font-size: 1.1rem; margin: 0 auto 0 0; }
.stage { display: grid; place-items: center; padding: 1rem 1.25rem 6rem; position: relative; }
.wrap { position: relative; } .fit { --chrome: 17rem; }
.wrap .book { filter: drop-shadow(0 1.6rem 1.8rem rgba(0,0,0,.5)); }
.pg { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 14%, transparent); background-image: radial-gradient(120% 80% at 30% 0%, color-mix(in srgb, var(--ink) 4%, transparent), transparent 60%); font-size: 1.82cqw; }
${M.tick}${M.underline}
.pill { position: absolute; left: 50%; bottom: -2.2rem; transform: translateX(-50%); z-index: 6; display: flex; align-items: center; gap: .9rem; padding: .55rem .6rem .55rem 1.3rem; background: var(--bg2); border: 1px solid var(--line2); border-radius: 999px; box-shadow: 0 .8rem 1.6rem rgba(0,0,0,.4); }
.pill .head { font-size: 1.7rem; width: 13rem; }
.pill .btn { border-radius: 999px; }
.pill .info { font-family: var(--font-mono); font-size: .68rem; color: var(--muted); padding-right: .6rem; white-space: nowrap; }
.drawer { position: fixed; top: 0; bottom: 0; left: 0; width: min(18rem, 86vw); background: var(--bg2); border-right: 1px solid var(--line2); transform: translateX(-102%); transition: transform .28s ease; z-index: 20; padding: 1.2rem; overflow: auto; }
.drawer.open { transform: none; }
.drawer h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.15rem; margin: 0 0 1rem; }
.drawer ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .2rem; } .chbtn { width: 100%; text-align: left; display: flex; gap: .8rem; padding: .5rem .6rem; background: none; border: 0; border-radius: 3px; font-family: var(--font-chrome); } .chbtn:hover { background: var(--bg3); } .chbtn.on { background: var(--bg3); box-shadow: inset 3px 0 var(--accent); } .chn { font-family: var(--font-mono); font-size: .7rem; color: var(--muted); width: 1.4rem; padding-top: .25rem; }
@media (max-width: 760px) { .pill { position: static; transform: none; margin: 1rem auto 0; display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: .6rem; border-radius: 12px; padding: .7rem; } .pill .head { grid-column: 1 / -1; width: auto; order: -1; font-size: 1.9rem; } .pill .info { grid-column: 1 / -1; text-align: center; padding: 0; } .stage { padding-bottom: 2rem; } .bar h1 { font-size: .95rem; } }
`,
  html: `
<div class="bar"><button class="btn" type="button" data-act="toc" aria-expanded="false" aria-controls="toc">Contents</button><h1>Meditations · The Second Book</h1><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<nav class="drawer" id="toc" data-toc aria-label="Contents"><h2>Meditations</h2><ul data-toc-list></ul></nav>
<div class="stage"><div class="wrap fit"><div class="book"></div>
  <div class="pill"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><div class="head" data-head aria-label="Current word"></div><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button><span class="info" data-pageinfo></span></div>
</div></div>`,
};
