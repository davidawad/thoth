/* Reusable "current location" marker snippets. Engine hooks: .pg.has-cur (page holding the
   current word, with --cy/--cx/--ch/--cw), .w.in-s (words of the current sentence),
   .w.read (already read), .w.cur (the current word; its focus letter is .f). */
module.exports = {
  ribbon: `
.pg.has-cur::after { content: ''; position: absolute; top: -1px; width: 2.6cqw; height: 8cqw; background: var(--accent); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%); z-index: 3; filter: drop-shadow(0 .4cqw .4cqw var(--shade)); }
.pg.L.has-cur::after { right: 2.2cqw; } .pg.R.has-cur::after { left: 2.2cqw; } .single .pg.has-cur::after { right: 8cqw; left: auto; width: 6.4cqw; height: 18cqw; }`,
  band: `
.w.in-s { background: var(--hl); box-decoration-break: clone; -webkit-box-decoration-break: clone; }`,
  underline: `
.w.in-s { text-decoration: underline; text-decoration-color: var(--hl-edge); text-decoration-thickness: .08em; text-underline-offset: .28em; }`,
  tick: `
.pg.has-cur::before { content: ''; position: absolute; top: calc(var(--cy) + .1em); height: var(--ch); width: .55cqw; background: var(--accent); border-radius: 1px; z-index: 2; }
.pg.L.has-cur::before { left: 2.4cqw; } .pg.R.has-cur::before { right: 2.4cqw; } .single .pg.has-cur::before { left: 3cqw; right: auto; width: 1.4cqw; }`,
  corner: `
.pg.has-cur::after { content: ''; position: absolute; bottom: 0; width: 8cqw; height: 8cqw; z-index: 3; }
.pg.R.has-cur::after, .single .pg.has-cur::after { right: 0; left: auto; background: linear-gradient(135deg, var(--accent) 0 50%, var(--desk) 50% 100%); filter: drop-shadow(-.3cqw -.3cqw .4cqw var(--shade)); }
.pg.L.has-cur::after { left: 0; right: auto; background: linear-gradient(225deg, var(--accent) 0 50%, var(--desk) 50% 100%); filter: drop-shadow(.3cqw -.3cqw .4cqw var(--shade)); }`,
  spotlight: `
.w { color: var(--ink-dim); transition: color .25s; } .w.in-s, .w.cur { color: var(--ink); } .w.read:not(.in-s) { color: color-mix(in srgb, var(--ink-dim) 70%, transparent); }`,
};
