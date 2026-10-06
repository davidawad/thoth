const M = require('../markers.cjs');
module.exports = {
  slug: 'marginalia',
  title: 'Marginalia',
  desc: 'A reader’s manuscript: wide outer margins carry handwritten-style notes, a ruled margin line, a margin tick and a pen underline mark the passage. The playback head lives in a side panel beside the book.',
  cfg: {
    wpp: 152,
    runHeads: ['MEDITATIONS', 'LIBER II'],
    notes: {
      0: 'Compare the opening here with the same warning about time in Book IV.',
      1: 'Note: the "channel from the spring" image.',
      2: 'The inward turn: care for the soul first.',
      3: 'Short sentences, urgent tone.',
      4: 'Theophrastus, cited by Marcus.',
      5: 'Pleasure and grief weighed.',
      6: 'Mark for later.',
      7: 'Duty, then rest.',
      8: 'Return here.',
      9: 'Read aloud.',
      10: 'End of the section.',
    },
  },
  pal: {
    dark: {
      paper: '#d9ccab',
      paper2: '#c7b88f',
      ink: '#2b2013',
      'ink-dim': '#7a6a4c',
      focus: '#b3261e',
      hl: 'rgba(120,70,20,.22)',
      'hl-edge': '#7a3b14',
      desk: '#1b1712',
    },
    light: {
      paper: '#f3e8cc',
      paper2: '#e5d6aa',
      ink: '#2b2013',
      focus: '#b3261e',
      hl: 'rgba(120,70,20,.2)',
      'hl-edge': '#7a3b14',
    },
    sepia: {
      paper: '#ecdcb0',
      paper2: '#dcc88f',
      ink: '#3b2f1e',
      focus: '#a3221a',
      hl: 'rgba(120,70,20,.22)',
      'hl-edge': '#7a3b14',
    },
  },
  css: `
.top { display: flex; gap: .8rem; align-items: center; padding: .9rem 1.4rem; } .top h1 { font-family: var(--font-display); font-weight: 500; font-size: 1.1rem; margin: 0 auto 0 0; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 15rem; gap: 1.4rem; padding: .6rem 1.4rem 2rem; align-items: start; }
.fit { --chrome: 9rem; --maxw: 1120px; }
.pg { font-size: 1.56cqw; line-height: 1.72; }
.pg.L { padding: 6cqw 5cqw 5cqw 13cqw; } .pg.R { padding: 6cqw 13cqw 5cqw 5cqw; }
.pg .txt p { text-indent: 0; margin-bottom: .7em; }
.pg.L { background-image: linear-gradient(90deg, transparent 11cqw, rgba(170,50,50,.55) 11cqw calc(11cqw + 1px), transparent calc(11cqw + 1px)), linear-gradient(90deg, var(--paper) 78%, var(--paper2)); }
.pg.R { background-image: linear-gradient(270deg, transparent 11cqw, rgba(170,50,50,.55) 11cqw calc(11cqw + 1px), transparent calc(11cqw + 1px)), linear-gradient(270deg, var(--paper) 78%, var(--paper2)); }
.note { position: absolute; top: 18cqw; width: 9.4cqw; font-family: var(--font-chrome); font-style: italic; font-size: 1.15cqw; line-height: 1.35; color: color-mix(in srgb, var(--ink) 80%, #36a); transform: rotate(-1.2deg); }
.pg.L .note { left: 1.4cqw; } .pg.R .note { right: 1.4cqw; text-align: left; transform: rotate(1deg); }
.note::before { content: '\\2192'; display: block; font-style: normal; color: var(--accent); }
.pg.has-cur .rh { color: var(--ink); }
${M.tick}${M.underline}
.pg.L.has-cur::after, .pg.R.has-cur::after { content: none; }
.w.in-s { text-decoration-style: wavy; text-decoration-thickness: .06em; }
.side { position: sticky; top: 1rem; display: grid; gap: 1rem; background: var(--bg2); border: 1px solid var(--line2); border-radius: 6px; padding: 1.1rem; }
.side .head { font-size: 1.9rem; background: var(--bg); border: 1px solid var(--line); border-radius: 4px; padding: .8rem .4rem; }
.side .row { display: flex; gap: .5rem; flex-wrap: wrap; } .side .row .btn { flex: 1; }
.side dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: .3rem .8rem; font-family: var(--font-mono); font-size: .72rem; color: var(--muted); } .side dd { margin: 0; color: var(--fg); text-align: right; }
.book { filter: drop-shadow(0 1.4rem 1.4rem rgba(0,0,0,.4)); }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } .side { position: static; } }
@media (max-width: 760px) { .note { display: none; } .pg.R, .pg.L { padding: 9cqw 8cqw 8cqw; } .pg { background-image: none !important; } }
`,
  html: `
<div class="top"><h1>Meditations · reader's copy</h1><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="layout"><div class="fit"><div class="book"></div></div>
<aside class="side" aria-label="Playback"><span class="lbl">Now reading</span><div class="head" data-head aria-label="Current word"></div>
<div class="row"><button class="btn" type="button" data-act="prev" data-prev aria-label="Previous page">‹</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next aria-label="Next page">›</button></div>
<div class="row"><button class="btn" type="button" data-act="slower">− speed</button><button class="btn" type="button" data-act="faster">+ speed</button></div>
<dl><dt>Speed</dt><dd data-rate></dd><dt>Position</dt><dd data-wordpos></dd><dt>View</dt><dd data-pageinfo></dd><dt>Read</dt><dd data-pct></dd></dl></aside></div>`,
};
