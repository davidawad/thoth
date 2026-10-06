const M = require('../markers.cjs');
module.exports = {
  slug: 'spine-gauge',
  title: 'Spine Gauge',
  desc: 'The book itself shows progress: page-stack edges thicken and thin as you read, and a gauge runs down the gutter with a dot at the line you are on. A highlighter band marks the sentence; the playback head floats as a small picture-in-picture card in the lower left.',
  cfg: { wpp: 165 },
  pal: {
    dark: {
      paper: '#e4d6b8',
      paper2: '#cfc09c',
      ink: '#261b10',
      'ink-dim': '#85775a',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.38)',
      'hl-edge': '#7a5a1a',
      desk: '#171310',
    },
    light: {
      paper: '#fbf5e4',
      paper2: '#e9dfc2',
      ink: '#261b10',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.34)',
    },
    sepia: {
      paper: '#f6e9c6',
      paper2: '#e3d3a4',
      ink: '#3b2f1e',
      focus: '#b3261e',
      hl: 'rgba(160,110,40,.3)',
    },
  },
  css: `
body { background: var(--desk, var(--bg)); }
.top { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.4rem; font-family: var(--font-display); } .top small { font-family: var(--font-mono); color: var(--muted); font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; margin-left: .6rem; }
.stage { padding: .6rem 1.4rem 2rem; display: grid; justify-items: center; } .fit { --chrome: 11rem; position: relative; }
.bookbox { position: relative; padding: 0 1.6cqw; } 
.stack { position: absolute; top: 1%; bottom: 1%; width: calc(var(--n, .5) * 2.4cqw + .4cqw); background: repeating-linear-gradient(90deg, var(--paper2) 0 1px, var(--paper) 1px 3px); box-shadow: 0 0 .5rem rgba(0,0,0,.4); border-radius: 2px; }
.stack.l { right: calc(100% - 2.8cqw); } .stack.r { left: calc(100% - 2.8cqw); }
.fit { --stackpad: 2.8cqw; } .bookbox { padding-inline: 2.8cqw; }
.gauge { position: absolute; left: 50%; top: 4%; bottom: 4%; width: 3px; margin-left: -1.5px; background: color-mix(in srgb, var(--ink) 18%, transparent); border-radius: 2px; z-index: 4; }
.gauge i { position: absolute; left: 0; right: 0; top: 0; height: calc(var(--p, 0) * 100%); background: var(--accent); border-radius: 2px; }
.gauge b { position: absolute; left: 50%; width: 11px; height: 11px; margin: -5px 0 0 -5.5px; border-radius: 50%; background: var(--focus); border: 2px solid var(--paper); top: calc(var(--p, 0) * 100%); }
${M.band}
.pip { position: fixed; left: 1rem; bottom: 1rem; z-index: 9; width: 16rem; background: var(--bg2); border: 1px solid var(--line2); border-radius: 8px; padding: .8rem; display: grid; gap: .6rem; box-shadow: 0 1rem 2rem rgba(0,0,0,.4); }
.pip .head { font-size: 1.7rem; background: var(--bg); border-radius: 4px; padding: .4rem 0; border: 1px solid var(--line); } .pip .row { display: flex; gap: .4rem; } .pip .row .btn { flex: 1; padding: .45rem .3rem; }
@media (max-width: 760px) { .pip { position: static; width: auto; margin: 0 1rem 1rem; } .bookbox { padding-inline: 4cqw; } .gauge { display: none; } }
`,
  html: `
<div class="top"><span>Meditations<small>Book II</small></span><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="stage"><div class="fit"><div class="bookbox" data-progress><i class="stack l" data-stack-l></i><i class="stack r" data-stack-r></i><div class="book"></div><div class="gauge" aria-hidden="true"><i></i><b></b></div></div><p class="lbl" style="text-align:center;margin:1.4rem 0 0"><span data-pageinfo></span> · <span data-pct></span> · <span data-left></span></p></div></div>
<div class="pip" aria-label="Playback"><div class="head" data-head aria-label="Current word"></div><div class="row"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button></div></div>`,
};
