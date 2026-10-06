const M = require('../markers.cjs');
module.exports = {
  slug: 'chapter-rail',
  title: 'Chapter Rail',
  desc: 'A navigator’s layout: a chapter rail down the left, a word scrubber under the book, and a ribbon plus a margin arrow that points at the line being read. The playback head is a lectern tab that slides up from the bottom edge and collapses to a tab.',
  cfg: { wpp: 160 },
  pal: {
    dark: {
      paper: '#e6d9bd',
      paper2: '#d2c4a1',
      ink: '#241a0f',
      'ink-dim': '#86785c',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.3)',
      'hl-edge': '#7a5a1a',
      desk: '#171310',
    },
    light: {
      paper: '#fdf8ea',
      paper2: '#ece2c6',
      ink: '#241a0f',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.28)',
    },
    sepia: {
      paper: '#f7ebc9',
      paper2: '#e5d5a8',
      ink: '#3b2f1e',
      focus: '#b3261e',
      hl: 'rgba(160,110,40,.26)',
    },
  },
  css: `
body { background: var(--desk, var(--bg)); }
.shell { display: grid; grid-template-columns: 13.5rem minmax(0, 1fr); min-height: 100svh; }
.railbar { border-right: 1px solid var(--line2); background: var(--bg2); padding: 1.2rem .9rem; position: sticky; top: 0; height: 100svh; overflow: auto; }
.railbar h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.1rem; margin: 0 0 .2rem; } .railbar p { margin: 0 0 1rem; } .railbar ul { list-style: none; padding: 0; margin: 0; border-left: 1px solid var(--line2); display: grid; }
.chbtn { width: 100%; display: flex; gap: .6rem; text-align: left; background: none; border: 0; padding: .35rem .6rem; margin-left: -1px; border-left: 3px solid transparent; font-family: var(--font-chrome); font-size: .95rem; color: var(--muted); } .chbtn.on { border-left-color: var(--accent); color: var(--fg); font-weight: 500; } .chn { font-family: var(--font-mono); font-size: .66rem; width: 1.2rem; padding-top: .25rem; }
.stage { padding: 1rem 1.4rem 8rem; display: grid; justify-items: center; align-content: start; gap: 1rem; } .fit { --chrome: 17rem; }
.scrub { width: min(1020px, 100%); display: grid; grid-template-columns: auto 1fr auto; gap: .8rem; align-items: center; } .scrub input { width: 100%; accent-color: var(--accent); }
.pg { font-size: 1.66cqw; }
${M.ribbon}${M.band}
.pg.has-cur::before { content: '\\25B6'; position: absolute; top: calc(var(--cy) + .1em); font-size: .9em; line-height: var(--ch); height: var(--ch); color: var(--accent); z-index: 2; }
.pg.L.has-cur::before { left: 2cqw; } .pg.R.has-cur::before { right: 2cqw; transform: scaleX(-1); } .single .pg.has-cur::before { left: 2.5cqw; right: auto; transform: none; }
.lectern { position: fixed; left: calc(13.5rem + (100% - 13.5rem) / 2); transform: translateX(-50%); bottom: 0; z-index: 9; width: min(30rem, calc(100% - 15rem)); background: var(--bg2); border: 1px solid var(--line2); border-bottom: 0; border-radius: 10px 10px 0 0; padding: .7rem 1rem 1rem; display: grid; gap: .6rem; transition: transform .3s; }
.lectern.collapsed { transform: translate(-50%, calc(100% - 2.4rem)); } .lectern .tab { display: flex; justify-content: space-between; align-items: center; } .lectern .head { font-size: 2.1rem; background: var(--bg); border: 1px solid var(--line); border-radius: 4px; padding: .4rem 0; } .lectern .row { display: flex; gap: .5rem; justify-content: center; }
@media (max-width: 860px) { .shell { grid-template-columns: 1fr; } .railbar { display: none; } .lectern { left: 50%; width: min(30rem, 100%); } }
`,
  html: `
<div class="shell"><nav class="railbar" aria-label="Chapters"><h2>Meditations</h2><p class="lbl">Marcus Aurelius</p><ul data-toc-list></ul><p style="margin-top:1rem"><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></p></nav>
<main class="stage"><div class="fit"><div class="book"></div></div>
<div class="scrub"><span class="lbl" data-wordpos></span><input type="range" min="0" max="100" value="0" data-scrub aria-label="Reading position"><span class="lbl" data-pct></span></div></main></div>
<div class="lectern" data-collapsible><div class="tab"><span class="lbl">Playback · <span data-rate></span></span><span style="display:flex;gap:.4rem"><button class="btn" type="button" data-act="theme" aria-label="Switch theme"><span data-themename></span></button><button class="btn" type="button" data-act="collapse" aria-label="Collapse playback">⌄</button></span></div><div class="head" data-head aria-label="Current word"></div><div class="row"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button></div></div>`,
};
