/* Generates the 10 standalone mockups (inline CSS + JS) and the gallery index.
   Run: node docs/mockups/book-view/build.cjs */
const fs = require('fs'),
  path = require('path');
const root = __dirname,
  src = path.join(root, 'src');
const base = fs.readFileSync(path.join(src, 'base.css'), 'utf8');
const engine = fs.readFileSync(path.join(src, 'engine.js'), 'utf8');
const text = fs.readFileSync(path.join(src, 'text.json'), 'utf8');
const designs = fs
  .readdirSync(path.join(src, 'designs'))
  .filter((f) => f.endsWith('.cjs'))
  .sort()
  .map((f) => ({ file: f, ...require(path.join(src, 'designs', f)) }));

const palCss = (pal) =>
  Object.entries(pal || {})
    .map(([theme, vars]) => {
      const body = Object.entries(vars)
        .map(([k, v]) => `--${k}: ${v};`)
        .join(' ');
      return theme === 'dark'
        ? `:root, :root[data-theme='dark'] { ${body} }`
        : `:root[data-theme='${theme}'] { ${body} }`;
    })
    .join('\n');

designs.forEach((d, i) => {
  const n = String(i + 1).padStart(2, '0');
  d.n = n;
  d.out = `${n}-${d.slug}.html`;
  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Thoth book view ${n}: ${d.title}</title>
<link rel="stylesheet" href="assets/fonts.css">
<style>
${base}
/* ---- design ${n}: ${d.title} ---- */
${palCss(d.pal)}
${d.css}
</style>
</head>
<body class="d${n}">
${d.html}
<script>window.BOOK_TEXT = ${text};\nwindow.BOOK_CFG = ${JSON.stringify(d.cfg || {})};</script>
<script>
${engine}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, d.out), html);
});

const cards = designs
  .map(
    (d) =>
      `<a class="card" href="${d.out}"><img src="screenshots/${d.n}.png" alt="Screenshot of mockup ${d.n}" loading="lazy" onerror="this.style.visibility='hidden'"><div><h2><span class="no">${d.n}</span> ${d.title}</h2><p>${d.desc}</p></div></a>`,
  )
  .join('\n');
fs.writeFileSync(
  path.join(root, 'index.html'),
  `<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thoth book view mockups</title><link rel="stylesheet" href="assets/fonts.css">
<style>
${base}
.wrap { max-width: 78rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 .5rem; }
.lede { max-width: 46rem; color: var(--muted); font-size: 1.1rem; margin: 0 0 1.2rem; }
.bar { display: flex; gap: .6rem; align-items: center; margin-bottom: 1.6rem; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1.2rem; }
.card { display: flex; flex-direction: column; gap: .7rem; text-decoration: none; color: inherit; border: 1px solid var(--line); background: var(--bg2); border-radius: 5px; overflow: hidden; }
.card:hover { border-color: var(--accent); }
.card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: top; background: var(--bg3); display: block; }
.card div { padding: 0 1rem 1rem; } .card h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.15rem; margin: 0 0 .3rem; }
.card p { margin: 0; color: var(--muted); font-size: .98rem; line-height: 1.4; } .no { font-family: var(--font-mono); color: var(--accent); font-size: .8rem; margin-right: .3rem; }
</style></head><body><div class="wrap">
<h1>Book view: ten directions</h1>
<p class="lede">The reading view as a rendered two-page book, separate from the landing page. The RSVP playback head is its own element and the current word's red focus letter shows in both the head and the book text. Each mockup turns pages (arrow keys or click a page), plays a demo word (space), and switches theme (T). Text is from Meditations (Marcus Aurelius, public domain).</p>
<div class="bar"><button class="btn" type="button" data-act="theme">Theme: <span data-themename>dark</span></button><span class="lbl">applies to this gallery only</span></div>
<div class="grid">
${cards}
</div></div>
<script>
(function(){var th=['dark','light','sepia'];var s=null;try{s=localStorage.getItem('bv-theme')}catch(e){}
function set(t){document.documentElement.setAttribute('data-theme',t);document.querySelector('[data-themename]').textContent=t;try{localStorage.setItem('bv-theme',t)}catch(e){}}
set(s||'dark');document.addEventListener('click',function(e){if(e.target.closest('[data-act=theme]'))set(th[(th.indexOf(document.documentElement.getAttribute('data-theme'))+1)%3]);});})();
</script></body></html>
`,
);
console.log(designs.map((d) => d.out).join('\n'));
