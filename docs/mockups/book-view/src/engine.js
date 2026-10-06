/* eslint-disable -- standalone browser mockup engine (inlined into static HTML), not app code */
/* ===== Thoth book-view mockup engine: paginates real prose, drives the page turn,
   the demo playback word, theme toggle and the data-* hooks the designs use. ===== */
(function () {
  var T = window.BOOK_TEXT,
    C = Object.assign(
      {
        wpp: 150,
        wppSingle: 96,
        rate: 230,
        forceSingle: false,
        runHeads: ['MEDITATIONS', 'THE SECOND BOOK'],
        notes: {},
        startWord: 24,
      },
      window.BOOK_CFG || {},
    );
  var $ = function (s, r) {
      return (r || document).querySelector(s);
    },
    $$ = function (s, r) {
      return Array.prototype.slice.call((r || document).querySelectorAll(s));
    };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* words with paragraph + sentence ids */
  var words = [],
    sent = 0;
  T.paras.forEach(function (p, pi) {
    p.split(/\s+/).forEach(function (t, k) {
      words.push({ t: t, p: pi, s: sent, open: k === 0 });
      if (/[.!?]["”’)\]]*$/.test(t)) sent++;
    });
    sent++;
  });
  var N = words.length,
    ci = Math.min(C.startWord, N - 1),
    pages = [],
    spread = 0,
    single = false,
    playing = false,
    busy = false,
    timer = null,
    rate = +((location.search.match(/rate=(\d+)/) || [])[1] || C.rate);

  var esc = function (s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  };
  function focusIdx(w) {
    var f = ((w.length - 1) / 2) | 0,
      j;
    for (j = f; j >= 0; j--) {
      if (/[aeiou]/i.test(w[j])) {
        f = j;
        break;
      }
    }
    return f;
  }

  function layout() {
    var per = single ? C.wppSingle : C.wpp,
      i = 0;
    pages = [];
    while (i < N) {
      pages.push([i, Math.min(i + per, N)]);
      i += per;
    }
  }
  var perUnit = function () {
    return single ? 1 : 2;
  };
  var spreadOfWord = function (i) {
    var pg = pages.findIndex(function (r) {
      return i >= r[0] && i < r[1];
    });
    return Math.floor(pg / perUnit());
  };
  var spreadCount = function () {
    return Math.ceil(pages.length / perUnit());
  };

  function pageHTML(idx, side) {
    if (idx < 0 || idx >= pages.length)
      return '<div class="rh"></div><div class="txt"></div><div class="folio"></div>';
    var r = pages[idx],
      html = '',
      last = -1;
    for (var i = r[0]; i < r[1]; i++) {
      var w = words[i];
      if (w.p !== last) {
        if (last !== -1) html += '</p>';
        html +=
          '<p class="' +
          (w.open ? 'open' + (i === 0 ? ' first' : '') : 'cont') +
          '">';
        last = w.p;
      }
      html +=
        '<span class="w' +
        (i === ci ? ' cur' : '') +
        '" data-i="' +
        i +
        '" data-s="' +
        w.s +
        '">' +
        wordInner(i) +
        '</span> ';
    }
    html += '</p>';
    var rh = (C.runHeads || [])[idx % 2 === 0 ? 0 : 1] || '';
    var note =
      C.notes && C.notes[idx]
        ? '<aside class="note">' + C.notes[idx] + '</aside>'
        : '';
    return (
      '<div class="rh"><span>' +
      rh +
      '</span><span>' +
      (C.runRight && idx % 2 === 0 ? C.runRight : '') +
      '</span></div><div class="txt">' +
      html +
      '</div><div class="folio">' +
      (idx + 1) +
      '</div>' +
      note +
      (C.pageExtra ? C.pageExtra(idx) : '') +
      '<i class="gutter"></i>'
    );
  }
  function wordInner(i) {
    var t = words[i].t;
    if (i !== ci) return esc(t);
    var f = focusIdx(t);
    return (
      esc(t.slice(0, f)) +
      '<b class="f">' +
      esc(t[f]) +
      '</b>' +
      esc(t.slice(f + 1))
    );
  }

  var book, spEl, L, R, F, Ff, Fb;
  function build() {
    book = $('.book');
    book.innerHTML =
      '<div class="spread"><section class="pg L"></section><section class="pg R"></section><div class="flip"><div class="face front"><section class="pg"></section><i class="shade"></i></div><div class="face back"><section class="pg"></section><i class="shade"></i></div></div></div>';
    spEl = $('.spread', book);
    L = $('.pg.L', spEl);
    R = $('.pg.R', spEl);
    F = $('.flip', spEl);
    Ff = $('.front .pg', F);
    Fb = $('.back .pg', F);
  }
  function fill(el, idx, side) {
    el.className =
      'pg ' + side + (idx < 0 || idx >= pages.length ? ' blank' : '');
    el.innerHTML = pageHTML(idx, side);
  }
  function show(k) {
    spread = Math.max(0, Math.min(spreadCount() - 1, k));
    var base = spread * perUnit();
    if (single) {
      fill(R, base, 'R');
      L.innerHTML = '';
    } else {
      fill(L, base, 'L');
      fill(R, base + 1, 'R');
    }
    mark();
    info();
  }
  function mark() {
    $$('.pg', spEl).forEach(function (pg) {
      pg.classList.remove('has-cur');
    });
    var el = $('.w.cur', spEl);
    if (!el) return;
    var pg = el.closest('.pg');
    pg.classList.add('has-cur');
    var pr = pg.getBoundingClientRect(),
      er = el.getBoundingClientRect(),
      k = pr.width / pg.offsetWidth || 1;
    pg.style.setProperty('--cy', (er.top - pr.top) / k + 'px');
    pg.style.setProperty('--cx', (er.left - pr.left) / k + 'px');
    pg.style.setProperty('--ch', er.height / k + 'px');
    pg.style.setProperty('--cw', er.width / k + 'px');
    var s = words[ci].s;
    $$('.w', spEl).forEach(function (w) {
      var i = +w.dataset.i;
      w.classList.toggle('in-s', +w.dataset.s === s);
      w.classList.toggle('read', i < ci);
    });
    spEl.style.setProperty(
      '--sy',
      er.top - spEl.getBoundingClientRect().top + 'px',
    );
  }
  function setCur(i) {
    var prev = $('.w.cur', spEl);
    if (prev) {
      prev.classList.remove('cur');
      prev.innerHTML = esc(words[+prev.dataset.i].t);
    }
    ci = i;
    var el = $('.w[data-i="' + i + '"]', spEl);
    if (el) {
      el.classList.add('cur');
      el.innerHTML = wordInner(i);
    }
    mark();
    head();
    info();
  }
  function head() {
    var t = words[ci].t,
      f = focusIdx(t);
    $$('[data-head]').forEach(function (h) {
      h.innerHTML =
        '<span class="hl">' +
        esc(t.slice(0, f)) +
        '</span><span class="hf">' +
        esc(t[f]) +
        '</span><span class="hr">' +
        esc(t.slice(f + 1)) +
        '</span>';
    });
  }
  function info() {
    var pg = pages.findIndex(function (r) {
        return ci >= r[0] && ci < r[1];
      }),
      pu = perUnit(),
      a = spread * pu + 1,
      b = Math.min(a + pu - 1, pages.length);
    var pct = Math.round((ci / (N - 1)) * 100);
    $$('[data-pageinfo]').forEach(function (e) {
      e.textContent =
        (pu === 1 || a === b ? 'Page ' + a : 'Pages ' + a + '–' + b) +
        ' of ' +
        pages.length;
    });
    $$('[data-pct]').forEach(function (e) {
      e.textContent = pct + '%';
    });
    $$('[data-left]').forEach(function (e) {
      e.textContent =
        '~' + Math.max(1, Math.round((N - ci) / (60000 / rate))) + ' min left';
    });
    $$('[data-progress]').forEach(function (e) {
      e.style.setProperty('--p', pct / 100);
    });
    $$('[data-wordpos]').forEach(function (e) {
      e.textContent = 'word ' + (ci + 1) + ' of ' + N;
    });
    $$('[data-chapinfo]').forEach(function (e) {
      e.textContent = T.chapter;
    });
    $$('[data-rate]').forEach(function (e) {
      e.textContent = Math.round((60000 / rate) * 1.0) + ' wpm';
    });
    $$('[data-scrub]').forEach(function (e) {
      e.max = N - 1;
      e.value = ci;
    });
    $$('[data-stack-l]').forEach(function (e) {
      e.style.setProperty(
        '--n',
        Math.min(1, (spread * pu) / Math.max(1, pages.length - 1)),
      );
    });
    $$('[data-stack-r]').forEach(function (e) {
      e.style.setProperty(
        '--n',
        1 - Math.min(1, ((spread + 1) * pu) / Math.max(1, pages.length)),
      );
    });
    $$('[data-prev]').forEach(function (e) {
      e.disabled = spread === 0;
    });
    $$('[data-next]').forEach(function (e) {
      e.disabled = spread >= spreadCount() - 1;
    });
  }

  /* page turn: a leaf (front/back faces) rotating about the gutter */
  function turn(dir, done) {
    var to = spread + dir;
    if (busy || to < 0 || to >= spreadCount()) {
      done && done(false);
      return;
    }
    var pu = perUnit(),
      a = spread * pu,
      na = to * pu;
    if (reduced) {
      show(to);
      firstWord();
      done && done(true);
      return;
    }
    busy = true;
    book.classList.add('turning');
    var anim;
    if (dir > 0) {
      if (single) {
        fill(R, na, 'R');
      } else {
        fill(R, na + 1, 'R');
      }
      fill(Ff, single ? a : a + 1, 'R');
      fill(Fb, single ? -1 : na, 'L');
      F.classList.add('on');
      anim = F.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }],
        {
          duration: 820,
          easing: 'cubic-bezier(.45,.05,.25,1)',
          fill: 'forwards',
        },
      );
    } else {
      if (single) {
        fill(R, a, 'R');
      } else {
        fill(L, na, 'L');
        fill(R, a + 1, 'R');
      }
      fill(Ff, single ? na : na + 1, 'R');
      fill(Fb, single ? -1 : a, 'L');
      F.classList.add('on');
      anim = F.animate(
        [{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }],
        {
          duration: 820,
          easing: 'cubic-bezier(.45,.05,.25,1)',
          fill: 'forwards',
        },
      );
    }
    var sh = $$('.shade', F),
      from = dir > 0 ? [0, 0.55, 0] : [0, 0.55, 0];
    sh.forEach(function (s) {
      s.animate(
        [{ opacity: 0 }, { opacity: 0.8, offset: 0.5 }, { opacity: 0 }],
        { duration: 820, easing: 'ease-in-out' },
      );
    });
    var fz = location.search.match(/flipat=([\d.]+)/);
    if (fz) {
      anim.pause();
      anim.currentTime = +fz[1] * 820;
      $$('.shade', F).forEach(function (x) {
        x.getAnimations().forEach(function (a) {
          a.pause();
          a.currentTime = +fz[1] * 820;
        });
      });
      return;
    }
    anim.onfinish = function () {
      anim.cancel();
      F.classList.remove('on');
      busy = false;
      book.classList.remove('turning');
      spread = to;
      show(to);
      if (!playing || !done) firstWord();
      done && done(true);
    };
  }
  function firstWord() {
    var r = pages[spread * perUnit()];
    if (
      r &&
      (ci < r[0] ||
        ci >=
          pages[
            Math.min(pages.length - 1, spread * perUnit() + perUnit() - 1)
          ][1])
    )
      setCur(r[0]);
    else mark();
    head();
    info();
  }

  /* playback */
  function tick() {
    if (!playing) return;
    var nx = ci + 1;
    if (nx >= N) {
      play(false);
      return;
    }
    if (spreadOfWord(nx) !== spread) {
      ci = nx;
      head();
      turn(1, function () {
        setCur(nx);
        timer = setTimeout(tick, rate);
      });
      return;
    }
    setCur(nx);
    var w = words[nx].t,
      d =
        rate *
        (w.length > 7 ? 1.25 : 1) *
        (/[,;]$/.test(w) ? 1.5 : 1) *
        (/[.!?]["”’)]?$/.test(w) ? 2.2 : 1);
    timer = setTimeout(tick, d);
  }
  function play(on) {
    playing = on === undefined ? !playing : on;
    document.body.classList.toggle('playing', playing);
    $$('[data-playlabel]').forEach(function (e) {
      e.textContent = playing ? 'Pause' : 'Play';
    });
    clearTimeout(timer);
    if (playing) {
      if (spreadOfWord(ci) !== spread) {
        show(spreadOfWord(ci));
      }
      timer = setTimeout(tick, 120);
    }
  }

  /* themes */
  var themes = ['dark', 'light', 'sepia'];
  function theme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $$('[data-themename]').forEach(function (e) {
      e.textContent = t;
    });
    try {
      localStorage.setItem('bv-theme', t);
    } catch (e) {}
    setTimeout(mark, 30);
  }

  /* chapters (mock table of contents for the book) */
  var CH = [
    'Book I',
    'Book II',
    'Book III',
    'Book IV',
    'Book V',
    'Book VI',
    'Book VII',
    'Book VIII',
    'Book IX',
    'Book X',
    'Book XI',
    'Book XII',
  ];
  function chapters() {
    $$('[data-toc-list]').forEach(function (ul) {
      ul.innerHTML = CH.map(function (c, i) {
        return (
          '<li><button type="button" class="chbtn' +
          (i === 1 ? ' on' : '') +
          '"' +
          (i === 1 ? ' aria-current="true"' : '') +
          '><span class="chn">' +
          (i + 1) +
          '</span><span>' +
          c +
          '</span></button></li>'
        );
      }).join('');
    });
    $$('[data-rail]').forEach(function (r) {
      r.innerHTML = CH.map(function (c, i) {
        return (
          '<i class="tick' + (i === 1 ? ' on' : '') + '" title="' + c + '"></i>'
        );
      }).join('');
    });
  }

  function relayout() {
    var s = C.forceSingle || matchMedia('(max-width: 760px)').matches;
    var w = ci;
    if (s === single && pages.length) return;
    single = s;
    layout();
    spEl.classList.toggle('single', single);
    show(spreadOfWord(w));
    setCur(w);
  }

  function boot() {
    build();
    chapters();
    layout();
    var st = null;
    try {
      st = localStorage.getItem('bv-theme');
    } catch (e) {}
    var q = (location.search.match(/theme=(\w+)/) || [])[1];
    theme(q || st || 'dark');
    single = C.forceSingle || matchMedia('(max-width: 760px)').matches;
    layout();
    spEl.classList.toggle('single', single);
    show(spreadOfWord(ci));
    setCur(ci);
    var qp = (location.search.match(/page=(\d+)/) || [])[1];
    if (qp) {
      show(+qp);
      setCur(pages[spread * perUnit()][0] + 14);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]');
      if (!a) {
        var pg = e.target.closest('.pg');
        if (
          pg &&
          !busy &&
          spEl.contains(pg) &&
          !window.getSelection().toString()
        ) {
          var rect = spEl.getBoundingClientRect();
          turn(
            e.clientX < rect.left + rect.width * (single ? 0.35 : 0.5) ? -1 : 1,
          );
        }
        return;
      }
      var k = a.dataset.act;
      if (k === 'next') turn(1, function () {});
      else if (k === 'prev') turn(-1, function () {});
      else if (k === 'play') play();
      else if (k === 'theme')
        theme(
          themes[
            (themes.indexOf(
              document.documentElement.getAttribute('data-theme'),
            ) +
              1) %
              3
          ],
        );
      else if (k === 'toc') {
        var t = $('[data-toc]');
        if (t) {
          var o = t.classList.toggle('open');
          a.setAttribute('aria-expanded', o);
        }
      } else if (k === 'faster') {
        rate = Math.max(70, rate - 30);
        info();
      } else if (k === 'slower') {
        rate = Math.min(600, rate + 30);
        info();
      } else if (k === 'collapse') {
        var c = a.closest('[data-collapsible]');
        c && c.classList.toggle('collapsed');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') turn(1, function () {});
      else if (e.key === 'ArrowLeft') turn(-1, function () {});
      else if (e.key === ' ') {
        e.preventDefault();
        play();
      } else if (e.key === 't')
        document.querySelector('[data-act=theme]') &&
          document.querySelector('[data-act=theme]').click();
      else if (e.key === 'Escape') {
        var t = $('[data-toc].open');
        t && t.classList.remove('open');
      }
    });
    $$('[data-scrub]').forEach(function (s) {
      s.addEventListener('input', function () {
        play(false);
        var w = +s.value;
        show(spreadOfWord(w));
        setCur(w);
      });
    });
    matchMedia('(max-width: 760px)').addEventListener('change', relayout);
    if (new URLSearchParams(location.search).has('play')) play(true);
    window.__book = {
      turn: turn,
      play: play,
      setCur: setCur,
      state: function () {
        return {
          spread: spread,
          ci: ci,
          single: single,
          pages: pages.length,
          busy: busy,
        };
      },
    };
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
