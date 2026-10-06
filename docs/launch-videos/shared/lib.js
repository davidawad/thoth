/* Deterministic timeline harness. Every concept is a pure function of time t (seconds).
   Render mode (?render): the renderer calls window.seek(t) per frame. Otherwise it plays in real time (click to restart). */
(function () {
  const P = new URLSearchParams(location.search);
  const T = (window.T = {});
  T.vertical = P.has('v');
  T.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  T.lerp = (a, b, k) => a + (b - a) * k;
  T.seg = (t, a, b) => T.clamp((t - a) / (b - a)); // 0..1 progress of t within [a,b]
  T.io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2); // cubic in-out
  T.out = (k) => 1 - Math.pow(1 - k, 4); // quart out
  T.expo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)); // expo out
  T.inn = (k) => k * k * k;
  T.back = (k) => {
    const c = 1.5,
      c3 = c + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
  };
  T.focusIndex = (w) => {
    const n = w.replace(/[^A-Za-z0-9]/g, '').length;
    return n <= 1 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4;
  };
  T.el = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  };
  T.mark = (
    extra = '',
  ) => `<svg viewBox="0 0 48 48" aria-hidden="true" ${extra}>
    <circle class="ring" cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>
    <g fill="currentColor">
      <g transform="rotate(0 24 24)"><rect class="ray" x="22.5" y="8" width="3" height="8" rx="1.5"/></g>
      <g transform="rotate(90 24 24)"><rect class="ray" x="22.5" y="8" width="3" height="8" rx="1.5"/></g>
      <g transform="rotate(180 24 24)"><rect class="ray" x="22.5" y="8" width="3" height="8" rx="1.5"/></g>
      <g transform="rotate(270 24 24)"><rect class="ray" x="22.5" y="8" width="3" height="8" rx="1.5"/></g>
      <circle class="disc" cx="24" cy="24" r="4.5"/></g></svg>`;
  /* shared end card; returns f(s) where s = seconds since the card began (needs ~4.5s) */
  T.endcard = () => {
    const e = T.el(
      `<div id="endcard">${T.mark()}<h1>Thoth <span>1.0</span></h1><div class="free">Free and open source</div><div class="url">github.com/davidawad/thoth</div></div>`,
    );
    document.body.appendChild(e);
    const ring = e.querySelector('.ring'),
      rays = [...e.querySelectorAll('.ray')],
      disc = e.querySelector('.disc');
    const h1 = e.querySelector('h1'),
      fr = e.querySelector('.free'),
      url = e.querySelector('.url');
    rays.forEach((r) => (r.style.transformBox = 'fill-box'));
    return (s) => {
      e.style.opacity = T.seg(s, 0, 0.5);
      const rp = T.io(T.seg(s, 0.2, 1.3));
      ring.style.opacity = T.seg(s, 0.2, 0.4);
      ring.setAttribute('stroke-dashoffset', 1 - rp);
      ring.setAttribute('stroke-dasharray', rp >= 1 ? 'none' : '1 1');
      disc.style.transformOrigin = '24px 24px';
      disc.setAttribute('transform', `scale(${T.back(T.seg(s, 0.9, 1.5))})`);
      disc.style.transformOrigin = 'center';
      rays.forEach((r, i) => {
        const k = T.out(T.seg(s, 1.0 + i * 0.07, 1.6 + i * 0.07));
        r.style.opacity = k;
        r.style.transform = `translateY(${(1 - k) * 5}px)`;
      });
      const rise = (el, a) => {
        const k = T.out(T.seg(s, a, a + 0.9));
        el.style.opacity = k;
        el.style.transform = `translateY(${(1 - k) * 2.2}vmin)`;
      };
      rise(h1, 1.5);
      rise(fr, 2.0);
      rise(url, 2.4);
    };
  };
  T.start = ({ duration, update, fps = 30 }) => {
    window.__duration = duration;
    window.__fps = fps;
    window.seek = (t) => update(Math.min(Math.max(t, 0), duration));
    const fonts = [
      '400 20px Fraunces',
      '600 20px Fraunces',
      'italic 400 20px Fraunces',
      '400 20px Newsreader',
      'italic 400 20px Newsreader',
      '500 20px Newsreader',
      '400 20px "IBM Plex Mono"',
      '500 20px "IBM Plex Mono"',
      '400 20px "Atkinson Hyperlegible"',
      '700 20px "Atkinson Hyperlegible"',
    ];
    window.__ready = Promise.all(fonts.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => {
        seek(0);
        return true;
      });
    if (!P.has('render')) {
      window.__ready.then(() => {
        let t0 = performance.now();
        const loop = () => {
          let t = (performance.now() - t0) / 1000;
          if (t > duration + 1.5) {
            t0 = performance.now();
            t = 0;
          }
          window.seek(t);
          requestAnimationFrame(loop);
        };
        loop();
        addEventListener('click', () => {
          t0 = performance.now();
        });
      });
    }
  };
  document.body.insertAdjacentHTML('beforeend', '<div class="vignette"></div>');
})();
