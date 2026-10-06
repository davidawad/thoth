const M = require('../markers.cjs');
module.exports = {
  slug: 'study-desk',
  title: 'Study Desk',
  desc: 'Cream paper spread on a dark desk. Ribbon bookmark hangs from the head of the page being read, a soft highlighter band marks the sentence, and the playback head docks in a wide bar under the book.',
  cfg: { wpp: 168, runRight: 'MARCUS AURELIUS' },
  pal: {
    dark: {
      paper: '#e9dcc0',
      paper2: '#d8c8a4',
      ink: '#2a1e12',
      'ink-dim': '#8a7a5e',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.38)',
      'hl-edge': '#7a5a1a',
      desk: '#14110d',
    },
    light: {
      paper: '#fffaf0',
      paper2: '#efe5cb',
      ink: '#2a1e12',
      'ink-dim': '#9a8c74',
      focus: '#c0261b',
      hl: 'rgba(206,160,50,.34)',
      desk: '#d9cba8',
    },
    sepia: {
      paper: '#f7ebcb',
      paper2: '#e6d6ab',
      ink: '#3b2f1e',
      'ink-dim': '#a08c68',
      focus: '#b3261e',
      hl: 'rgba(160,110,40,.3)',
      desk: '#c9b684',
    },
  },
  css: `
body { background: var(--desk); display: flex; flex-direction: column; min-height: 100svh; }
.progress { height: 3px; background: var(--line); } .progress i { display: block; height: 100%; width: calc(var(--p, 0) * 100%); background: var(--accent); transition: width .3s; }
.top { display: flex; align-items: center; gap: 1rem; padding: .9rem 1.5rem; }
.top h1 { font-family: var(--font-display); font-weight: 500; font-size: 1.15rem; margin: 0; flex: 1; } .top h1 small { font-family: var(--font-mono); font-size: .68rem; color: var(--muted); letter-spacing: .08em; margin-left: .6rem; text-transform: uppercase; }
.stage { flex: 1; display: grid; place-items: center; padding: 1rem 1.25rem; }
.deskbook { --chrome: 19rem; filter: drop-shadow(0 2.5rem 2rem rgba(0,0,0,.45)); }
.pg { font-family: var(--font-chrome); font-size: 1.7cqw; line-height: 1.58; background-image: repeating-linear-gradient(transparent 0 calc(1.58em - 1px), color-mix(in srgb, var(--ink) 5%, transparent) calc(1.58em - 1px) 1.58em); background-position: 0 6cqw; }
.pg .rh { border-bottom: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); padding-bottom: .5em; }
.pg .txt p:first-child.first::first-letter { font-family: var(--font-display); font-size: 3.3em; float: left; line-height: .82; padding: .06em .1em 0 0; color: var(--accent); }
${M.ribbon}${M.band}
.dock { display: grid; grid-template-columns: 1fr minmax(15rem, 22rem) 1fr; align-items: center; gap: 1rem; width: min(1020px, 100%); margin: 1.2rem auto 1.2rem; padding: .9rem 1.2rem; background: var(--bg2); border: 1px solid var(--line2); border-radius: 6px; }
.dock .head { font-size: 2.2rem; background: var(--bg); border-radius: 4px; padding: .35rem .8rem; border: 1px solid var(--line); }
.dock .l, .dock .r { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; } .dock .r { justify-content: flex-end; }
.dock .info { font-family: var(--font-mono); font-size: .72rem; color: var(--muted); }
@media (max-width: 760px) { .dock { grid-template-columns: 1fr; } .dock .r { justify-content: flex-start; } .deskbook { width: min(420px, 100%); } .top { padding: .7rem 1rem; } }
`,
  html: `
<div class="progress" data-progress><i></i></div>
<div class="top"><h1>Meditations <small>Marcus Aurelius · <span data-chapinfo></span></small></h1><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="stage"><div class="deskbook fit"><div class="book"></div></div></div>
<div class="dock">
  <div class="l"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹ Prev</button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">Next ›</button></div>
  <div class="head" data-head aria-label="Current word"></div>
  <div class="r"><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><span class="info"><span data-rate></span> · <span data-pageinfo></span> · <span data-pct></span></span></div>
</div>`,
};
