module.exports = {
  slug: 'e-ink',
  title: 'E-ink',
  desc: 'Flat, quiet, high-legibility pages in Atkinson Hyperlegible. Only the current word carries a heavy underline; the playback head sits in the bottom margin straddling the gutter; progress is a row of page dots.',
  cfg: { wpp: 136 },
  pal: {
    dark: {
      paper: '#121212',
      paper2: '#121212',
      ink: '#e8e6df',
      'ink-dim': '#77746b',
      focus: '#ff6a4d',
      hl: 'transparent',
      'hl-edge': '#e8e6df',
      desk: '#0b0b0b',
      shade: 'rgba(0,0,0,.6)',
    },
    light: {
      paper: '#f1f0ea',
      paper2: '#f1f0ea',
      ink: '#161614',
      'ink-dim': '#8a887e',
      focus: '#c62a1c',
      hl: 'transparent',
      'hl-edge': '#161614',
      desk: '#dcdad0',
      shade: 'rgba(0,0,0,.25)',
    },
    sepia: {
      paper: '#f1e7cb',
      paper2: '#f1e7cb',
      ink: '#2e2616',
      'ink-dim': '#8f8160',
      focus: '#b3261e',
      hl: 'transparent',
      'hl-edge': '#2e2616',
      desk: '#d6c89f',
      shade: 'rgba(60,40,10,.3)',
    },
  },
  css: `
body { background: var(--desk); }
.top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; font-family: var(--font-legible); } .top b { font-weight: 700; } .top .btn { background: none; }
.stage { display: grid; justify-items: center; padding: .4rem 1.25rem 1.5rem; gap: 1.1rem; } .fit { --chrome: 11rem; --maxw: 1040px; position: relative; }
.pg, .pg.L, .pg.R { font-family: var(--font-legible); font-size: 1.62cqw; line-height: 1.7; background: var(--paper); border-radius: 0; padding: 6cqw 6cqw 15cqw; }
.pg.L { border-right: 1px solid var(--line); } .pg .txt p { text-indent: 0; margin-bottom: .8em; }
.pg .rh { font-family: var(--font-mono); } .pg .gutter { display: none; }
.pg .folio { position: absolute; bottom: 2.4cqw; left: 6cqw; right: 6cqw; text-align: left; }
.pg.R .folio { text-align: right; }
.w.cur { background: none; box-shadow: none; text-decoration: underline; text-decoration-thickness: .16em; text-underline-offset: .22em; text-decoration-color: var(--ink); font-weight: 700; }
.inkhead { position: absolute; left: 50%; bottom: 1.6cqw; transform: translateX(-50%); z-index: 6; width: 24cqw; display: grid; justify-items: center; gap: .4cqw; background: var(--paper); padding: .6cqw 0 .4cqw; }
.inkhead .head { font-size: clamp(1.2rem, 2.6cqw, 2.4rem); width: 100%; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); padding: .25em 0; }
.dots { display: flex; gap: .45rem; flex-wrap: wrap; justify-content: center; } .dots i { width: .55rem; height: .55rem; border-radius: 50%; border: 1px solid var(--ink); display: block; } .dots i.on { background: var(--ink); }
.ctl { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; justify-content: center; } .ctl .btn { background: none; border-color: var(--ink); } .ctl .btn.pri { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.flip .shade { opacity: 0; }
@media (max-width: 760px) { .pg, .pg.L, .pg.R { font-size: 4.6cqw; padding: 9cqw 8cqw 12cqw; } .pg .folio { bottom: 4cqw; } .inkhead { position: static; transform: none; width: 100%; margin-top: .6rem; } }
`,
  html: `
<div class="top"><span><b>Meditations</b> · Marcus Aurelius</span><button class="btn" type="button" data-act="theme">Theme: <span data-themename></span></button></div>
<div class="stage"><div class="fit"><div class="book"></div><div class="inkhead" data-collapsible><div class="head" data-head aria-label="Current word"></div></div></div>
<div class="dots" id="dots" aria-hidden="true"></div>
<div class="ctl"><button class="btn" type="button" data-act="prev" data-prev>‹ Prev</button><button class="btn pri" type="button" data-act="play"><span data-playlabel>Play</span></button><button class="btn" type="button" data-act="next" data-next>Next ›</button><span class="lbl" data-pageinfo></span></div></div>
<script>(function(){var d=document.getElementById('dots');function r(){var st=window.__book&&window.__book.state();if(!st)return setTimeout(r,60);d.innerHTML=Array.from({length:Math.ceil(st.pages/(st.single?1:2))},function(_,i){return '<i'+(i===st.spread?' class="on"':'')+'></i>'}).join('');}setInterval(r,250);r();})();</script>`,
};
